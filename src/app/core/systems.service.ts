import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { validateManifest } from './manifest';
import { CatalogEntry, LoadedItem, Manifest, SystemBundle } from './models';
import { extractSnippet } from './snippet';

export const SYSTEMS_BASE = '/systems';

@Injectable({ providedIn: 'root' })
export class SystemsService {
  private readonly http = inject(HttpClient);
  private readonly bundles = new Map<string, Promise<SystemBundle>>();
  private antiSlop: Promise<string> | null = null;

  fileUrl(slug: string, file: string): string {
    return `${SYSTEMS_BASE}/${slug}/${file}`;
  }

  async loadIndex(): Promise<CatalogEntry[]> {
    const index = await firstValueFrom(this.http.get<{ systems: string[] }>(`${SYSTEMS_BASE}/index.json`));
    return Promise.all(
      index.systems.map(async (slug) => ({
        slug,
        manifest: await this.loadManifest(slug).catch(() => null),
      })),
    );
  }

  async loadManifest(slug: string): Promise<Manifest> {
    const raw = await firstValueFrom(this.http.get<unknown>(this.fileUrl(slug, 'manifest.json')));
    const errors = validateManifest(raw);
    if (errors.length) throw new Error(`Invalid manifest for ${slug}: ${errors.join('; ')}`);
    return raw as Manifest;
  }

  loadBundle(slug: string): Promise<SystemBundle> {
    let pending = this.bundles.get(slug);
    if (!pending) {
      pending = this.fetchBundle(slug);
      this.bundles.set(slug, pending);
      pending.catch(() => this.bundles.delete(slug));
    }
    return pending;
  }

  loadAntiSlop(): Promise<string> {
    if (!this.antiSlop) {
      const pending = this.text(`${SYSTEMS_BASE}/_global/anti-slop.md`);
      this.antiSlop = pending;
      pending.catch(() => (this.antiSlop = null));
    }
    return this.antiSlop;
  }

  private async fetchBundle(slug: string): Promise<SystemBundle> {
    const manifest = await this.loadManifest(slug);
    const [theme, components, pages] = await Promise.all([
      this.text(this.fileUrl(slug, 'theme.css')),
      Promise.all(manifest.components.map((c) => this.loadItem(slug, c.id, c.name, c.notes, c.file))),
      Promise.all(manifest.pages.map((p) => this.loadItem(slug, p.id, p.name, '', p.file))),
    ]);
    return { manifest, theme, components, pages };
  }

  private async loadItem(slug: string, id: string, name: string, notes: string, file: string): Promise<LoadedItem> {
    try {
      const html = await this.text(this.fileUrl(slug, file));
      return { id, name, notes, file, snippet: extractSnippet(html) };
    } catch {
      return { id, name, notes, file, snippet: null };
    }
  }

  private text(url: string): Promise<string> {
    return firstValueFrom(this.http.get(url, { responseType: 'text' }));
  }
}

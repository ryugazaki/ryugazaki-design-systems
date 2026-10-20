import { TestBed } from '@angular/core/testing';
import { CopyBar } from './copy-bar';
import { ClipboardService } from '../../core/clipboard.service';
import { ToastService } from '../../core/toast.service';

describe('CopyBar', () => {
  async function setup(copyResult: boolean) {
    await TestBed.configureTestingModule({
      imports: [CopyBar],
      providers: [{ provide: ClipboardService, useValue: { copy: () => Promise.resolve(copyResult) } }],
    }).compileComponents();
    const fixture = TestBed.createComponent(CopyBar);
    fixture.componentRef.setInput('prompt', 'x'.repeat(4000));
    fixture.componentRef.setInput('name', 'Neo-Brutalist');
    fixture.detectChanges();
    return fixture;
  }

  it('shows the token estimate', async () => {
    const fixture = await setup(true);
    expect(fixture.nativeElement.textContent).toContain('~1.0k tokens');
  });

  it('confirms with a toast when the copy works', async () => {
    const fixture = await setup(true);
    fixture.nativeElement.querySelector('button').click();
    await fixture.whenStable();
    expect(TestBed.inject(ToastService).message()).toBe('Copied Neo-Brutalist for your agent');
  });

  it('opens the manual copy sheet when the clipboard is blocked', async () => {
    const fixture = await setup(false);
    fixture.nativeElement.querySelector('button').click();
    await fixture.whenStable();
    fixture.detectChanges();
    const textarea: HTMLTextAreaElement = fixture.nativeElement.querySelector('textarea');
    expect(textarea).not.toBeNull();
    expect(textarea.value.length).toBe(4000);
  });
});

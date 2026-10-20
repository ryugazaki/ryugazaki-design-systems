import { TestBed } from '@angular/core/testing';
import { PreviewFrame } from './preview-frame';

describe('PreviewFrame', () => {
  it('renders a sandboxed iframe sized to the viewport with the built document', async () => {
    const fixture = TestBed.createComponent(PreviewFrame);
    fixture.componentRef.setInput('snippet', '<button>Go</button>');
    fixture.componentRef.setInput('theme', '@theme {}');
    fixture.componentRef.setInput('fonts', []);
    fixture.componentRef.setInput('mode', 'dark');
    fixture.componentRef.setInput('viewport', 768);
    fixture.componentRef.setInput('label', 'Button preview');
    fixture.detectChanges();
    await fixture.whenStable();

    const iframe: HTMLIFrameElement = fixture.nativeElement.querySelector('iframe');
    expect(iframe.getAttribute('sandbox')).toBe('allow-scripts');
    expect(iframe.title).toBe('Button preview');
    expect(iframe.style.width).toBe('768px');
    expect(iframe.srcdoc).toContain('<html lang="en" class="dark">');
    expect(iframe.srcdoc).toContain('<button>Go</button>');
  });

  it('uses the device height for the viewport when fit is device', async () => {
    const fixture = TestBed.createComponent(PreviewFrame);
    fixture.componentRef.setInput('snippet', '<div class="min-h-screen">Page</div>');
    fixture.componentRef.setInput('theme', '@theme {}');
    fixture.componentRef.setInput('fonts', []);
    fixture.componentRef.setInput('viewport', 375);
    fixture.componentRef.setInput('fit', 'device');
    fixture.detectChanges();
    await fixture.whenStable();

    const iframe: HTMLIFrameElement = fixture.nativeElement.querySelector('iframe');
    expect(iframe.style.height).toBe('812px');
  });
});

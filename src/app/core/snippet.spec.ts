import { dedent, extractSnippet } from './snippet';

describe('extractSnippet', () => {
  it('returns the dedented content between markers', () => {
    const html = [
      '<body>',
      '  <!-- snippet:start -->',
      '    <button class="a">',
      '      Go',
      '    </button>',
      '  <!-- snippet:end -->',
      '</body>',
    ].join('\r\n');
    expect(extractSnippet(html)).toBe('<button class="a">\n  Go\n</button>');
  });

  it('returns null when a marker is missing or out of order', () => {
    expect(extractSnippet('<p>no markers</p>')).toBeNull();
    expect(extractSnippet('<!-- snippet:end --><!-- snippet:start -->')).toBeNull();
  });
});

describe('dedent', () => {
  it('ignores blank lines when measuring indentation', () => {
    expect(dedent('\n    a\n\n      b\n')).toBe('a\n\n  b');
  });
});

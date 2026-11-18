import { render, screen, cleanup } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { TripIndex, TripStory } from './trip-stories';

afterEach(cleanup);
it('links each homepage journey to its own story', () => {
  render(<TripIndex />);
  for (const slug of ['china', 'thailand', 'madagascar']) {
    expect(document.querySelector(`a[href="/stories/${slug}"]`)).toBeInTheDocument();
  }
});
it('shows the original journey narrative on each story', () => {
  const cases = [
    ['china', /В 2025 году мы проехали Китай с севера на юг/],
    ['thailand', /Четверо друзей отправились в большое путешествие по Азии/],
    ['madagascar', /В 2025 году мне удалось отправиться на Мадагаскар/],
  ] as const;
  for (const [slug, text] of cases) {
    const view = render(<TripStory slug={slug} />);
    expect(screen.getByText(text)).toBeInTheDocument();
    view.unmount();
  }
});

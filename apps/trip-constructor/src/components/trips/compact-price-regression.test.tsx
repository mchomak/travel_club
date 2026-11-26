import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, test, vi } from 'vitest';
import { ItemForm } from './item-form';
import { emptyDay, newItem, newTrip } from '@/lib/trip-ui';

afterEach(cleanup);

test('editing the price of a reloaded transfer saves the entered value', async () => {
  const day = emptyDay('2026-10-01');
  const item = { ...newItem('transfer', day, 'RUB', day.date), subtype: 'bus' as const, title: 'Автобус', calculation_mode: 'fixed' as const, unit_price: '123.00', quantity: '1.0000' };
  const trip = { ...newTrip(), start_date: day.date, end_date: day.date, days: [day], items: [item], rates: [] };
  const save = vi.fn();
  const user = userEvent.setup();
  render(<ItemForm initial={item} trip={trip} playgroundCompact onSubmit={save} onCancel={() => {}} />);
  await user.clear(screen.getByLabelText('Название события'));
  await user.type(screen.getByLabelText('Название события'), 'Автобус новый');
  await user.click(screen.getByText('Стоимость', { selector: 'strong' }));
  const price = screen.getByLabelText('Цена за единицу') as HTMLInputElement;
  const displayedPrice = price.value;
  fireEvent.focus(price);
  expect(price).toHaveValue(displayedPrice);
  await user.clear(price);
  await user.type(price, '234');
  await user.click(screen.getByRole('button', { name: 'Сохранить' }));
  expect(save).toHaveBeenCalledWith(expect.objectContaining({ title: 'Автобус новый', unit_price: '234' }), undefined);
});

test.each([
  ['known price', '123.00', false, true],
  ['free', '0.00', false, true],
  ['unknown', '0.00', true, false],
] as const)('opening and saving a %s preserves its stored price and status', async (_label, unit_price, price_pending, included) => {
  const day = emptyDay('2026-10-01');
  const item = { ...newItem('transfer', day, 'RUB', day.date), subtype: 'bus' as const, title: 'Автобус', unit_price, price_pending, included };
  const trip = { ...newTrip(), start_date: day.date, end_date: day.date, days: [day], items: [item], rates: [] };
  const save = vi.fn();
  const user = userEvent.setup();
  render(<ItemForm initial={item} trip={trip} playgroundCompact onSubmit={save} onCancel={() => {}} />);
  await user.click(screen.getByText('Стоимость', { selector: 'strong' }));
  const price = screen.getByLabelText('Цена машины');
  const displayedPrice = (price as HTMLInputElement).value;
  fireEvent.focus(price);
  expect(price).toHaveValue(displayedPrice);
  await user.click(screen.getByRole('button', { name: 'Сохранить' }));
  expect(save).toHaveBeenCalledWith(item, undefined);
});

test('editing a saved fractional price preserves the entered decimal amount', async () => {
  const day = emptyDay('2026-10-01');
  const item = { ...newItem('transfer', day, 'RUB', day.date), title: 'Автобус', unit_price: '123.40', price_pending: false };
  const trip = { ...newTrip(), start_date: day.date, end_date: day.date, days: [day], items: [item], rates: [] };
  const save = vi.fn();
  const user = userEvent.setup();
  render(<ItemForm initial={item} trip={trip} playgroundCompact onSubmit={save} onCancel={() => {}} />);
  await user.click(screen.getByText('Стоимость', { selector: 'strong' }));
  const price = screen.getByLabelText('Цена машины');
  expect(price).toHaveValue('123.40');
  await user.clear(price);
  await user.type(price, '234.56');
  await user.click(screen.getByRole('button', { name: 'Сохранить' }));
  expect(save).toHaveBeenCalledWith(expect.objectContaining({ unit_price: '234.56', price_pending: false }), undefined);
});

test.each([
  ['known', '123.00', false, true],
  ['free', '0.00', false, true],
  ['unknown', '0.00', true, false],
] as const)('editing another field preserves the %s price exactly', async (_label, unit_price, price_pending, included) => {
  const day = emptyDay('2026-10-01');
  const item = { ...newItem('transfer', day, 'RUB', day.date), title: 'Автобус', unit_price, price_pending, included };
  const trip = { ...newTrip(), start_date: day.date, end_date: day.date, days: [day], items: [item], rates: [] };
  const save = vi.fn();
  const user = userEvent.setup();
  render(<ItemForm initial={item} trip={trip} playgroundCompact onSubmit={save} onCancel={() => {}} />);
  await user.clear(screen.getByLabelText('Название события'));
  await user.type(screen.getByLabelText('Название события'), 'Новый автобус');
  await user.click(screen.getByRole('button', { name: 'Сохранить' }));
  expect(save).toHaveBeenCalledWith({ ...item, title: 'Новый автобус' }, undefined);
});

test.each([
  ['known to unknown', '123.00', false, true, 'pending', null, '123.00', true, false],
  ['known to free', '123.00', false, true, 'free', null, '0', false, true],
  ['unknown to known', '0.00', true, false, 'known', '25.75', '25.75', false, false],
  ['free to known', '0.00', false, true, 'known', '25.75', '25.75', false, true],
] as const)('%s saves the chosen price status', async (_label, unit_price, price_pending, included, status, entered, expectedPrice, expectedPending, expectedIncluded) => {
  const day = emptyDay('2026-10-01');
  const item = { ...newItem('transfer', day, 'RUB', day.date), title: 'Автобус', unit_price, price_pending, included };
  const trip = { ...newTrip(), start_date: day.date, end_date: day.date, days: [day], items: [item], rates: [] };
  const save = vi.fn();
  const user = userEvent.setup();
  render(<ItemForm initial={item} trip={trip} playgroundCompact onSubmit={save} onCancel={() => {}} />);
  await user.click(screen.getByText('Стоимость', { selector: 'strong' }));
  await user.selectOptions(screen.getByLabelText('Статус стоимости'), status);
  if (entered) {
    const price = screen.getByLabelText('Цена машины');
    await user.clear(price);
    await user.type(price, entered);
  }
  await user.click(screen.getByRole('button', { name: 'Сохранить' }));
  expect(save).toHaveBeenCalledWith(expect.objectContaining({ unit_price: expectedPrice, price_pending: expectedPending, included: expectedIncluded }), undefined);
});

import { afterEach, expect, test, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ItemForm } from './item-form';
import { emptyDay, newItem, newTrip } from '@/lib/trip-ui';

afterEach(cleanup);
test('flight cost shows calculated original and converted totals', async () => {
 const day = emptyDay('2026-10-01');
 const item = { ...newItem('flight', day, 'EUR', day.date), unit_price: '100', calculation_mode: 'per_person' as const, included: false };
 const trip = { ...newTrip(), participants: 3, start_date: day.date, end_date: day.date, days: [day], items: [item], rates: [{currency: 'EUR', rate: '90'}] };
 render(<ItemForm initial={item} trip={trip} onSubmit={vi.fn()} onCancel={vi.fn()} />);
 await userEvent.click(screen.getByText('Стоимость', { selector: 'summary span' }));
 expect(screen.getAllByText(/300,00.*EUR/)[0]).toBeVisible();
 expect(screen.getByText(/27\s?000,00.*RUB/)).toBeVisible();
 expect(screen.getByText(/Исключён из итоговой стоимости/)).toBeVisible();
});

test.each([
 ['unknown price', { price_pending: true, included: false, unit_price: '100' }, [{currency: 'EUR', rate: '90'}], 'Стоимость неизвестна'],
 ['missing exchange rate', { price_pending: false, included: true, unit_price: '100' }, [], 'Укажите курс валюты'],
 ['known zero', { price_pending: false, included: true, unit_price: '0' }, [{currency: 'EUR', rate: '90'}], '0,00 EUR'],
] as const)('%s has a distinct cost state', async (_name, fields, rates, expected) => {
 const day = emptyDay('2026-10-01');
 const item = { ...newItem('flight', day, 'EUR', day.date), ...fields };
 const trip = { ...newTrip(), start_date: day.date, end_date: day.date, days: [day], items: [item], rates: [...rates] };
 render(<ItemForm initial={item} trip={trip} onSubmit={vi.fn()} onCancel={vi.fn()} />);
 await userEvent.click(screen.getByText('Стоимость', { selector: 'summary span' }));
 expect(screen.getAllByText(expected)[0]).toBeVisible();
});

test('flight shows compact quantity without changing the saved value', async () => {
 const day = emptyDay('2026-10-01');
 const item = { ...newItem('flight', day, 'RUB', day.date), quantity: '1.0000', unit_price: '100' };
 const trip = { ...newTrip(), start_date: day.date, end_date: day.date, days: [day], items: [item], rates: [] };
 const save = vi.fn();
 render(<ItemForm initial={item} trip={trip} onSubmit={save} onCancel={vi.fn()} />);
 await userEvent.click(screen.getByText('Стоимость', { selector: 'summary span' }));
 await userEvent.click(screen.getByText('Дополнительные параметры'));
 expect(screen.getByLabelText('Количество')).toHaveValue('1');
 await userEvent.click(screen.getByRole('button', { name: 'Сохранить перелёт' }));
 expect(save).toHaveBeenCalledWith(item, undefined);
});

test('flight status changes explicitly between unknown and free', async () => {
 const day = emptyDay('2026-10-01');
 const item = { ...newItem('flight', day, 'RUB', day.date), unit_price: '125', included: true };
 const trip = { ...newTrip(), start_date: day.date, end_date: day.date, days: [day], items: [item], rates: [] };
 const save = vi.fn();
 render(<ItemForm initial={item} trip={trip} onSubmit={save} onCancel={vi.fn()} />);
 await userEvent.click(screen.getByText('Стоимость', { selector: 'summary span' }));
 await userEvent.selectOptions(screen.getByLabelText('Статус стоимости'), 'pending');
 expect(screen.getByLabelText('Статус стоимости')).toHaveValue('pending');
 await userEvent.selectOptions(screen.getByLabelText('Статус стоимости'), 'free');
 await userEvent.click(screen.getByRole('button', { name: 'Сохранить перелёт' }));
 expect(save).toHaveBeenCalledWith(expect.objectContaining({unit_price:'0', price_pending:false, included:true}), undefined);
});

test('making a price free preserves a changed exclusion choice', async () => {
 const day = emptyDay('2026-10-01');
 const item = { ...newItem('flight', day, 'RUB', day.date), unit_price: '125', included: true };
 const trip = { ...newTrip(), start_date: day.date, end_date: day.date, days: [day], items: [item], rates: [] };
 const save = vi.fn();
 render(<ItemForm initial={item} trip={trip} onSubmit={save} onCancel={vi.fn()} />);
 await userEvent.click(screen.getByText('Стоимость', { selector: 'summary span' }));
 await userEvent.click(screen.getByLabelText('Учитывать в стоимости поездки'));
 await userEvent.selectOptions(screen.getByLabelText('Статус стоимости'), 'free');
 await userEvent.click(screen.getByRole('button', { name: 'Сохранить перелёт' }));
 expect(save).toHaveBeenCalledWith(expect.objectContaining({unit_price:'0', price_pending:false, included:false}), undefined);
});

test('re-entering a price for an initially pending flight preserves manual exclusion', async () => {
  const day = emptyDay('2026-10-01');
  const item = { ...newItem('flight', day, 'RUB', day.date), price_pending: true, included: false };
  const trip = { ...newTrip(), start_date: day.date, end_date: day.date, days: [day], items: [item], rates: [] };
  const save = vi.fn();
  const user = userEvent.setup();
  render(<ItemForm initial={item} trip={trip} onSubmit={save} onCancel={vi.fn()} />);

  await user.click(screen.getByText('Стоимость', { selector: 'summary span' }));
  const price = screen.getByLabelText('Цена билета');
  const status = screen.getByLabelText('Статус стоимости');
  const included = screen.getByLabelText('Учитывать в стоимости поездки');
  await user.type(price, '100');
  expect(included).toBeChecked();
  await user.click(included);
  await user.selectOptions(status, 'pending');
  await user.clear(price);
  await user.type(price, '250');
  expect(status).toHaveValue('known');
  await user.click(screen.getByRole('button', { name: 'Сохранить перелёт' }));

  expect(save).toHaveBeenCalledWith(expect.objectContaining({ unit_price: '250', price_pending: false, included: false }), undefined);
});

test('a non-flight cost fieldset is marked as the cost section', () => {
  const day = emptyDay('2026-10-01');
  const item = newItem('transfer', day, 'RUB', day.date);
  const trip = { ...newTrip(), start_date: day.date, end_date: day.date, days: [day], items: [item], rates: [] };
  render(<ItemForm initial={item} trip={trip} onSubmit={vi.fn()} onCancel={vi.fn()} />);

  expect(screen.getByRole('group', { name: 'Стоимость' })).toHaveAttribute('data-editor-section', 'cost');
});

test.each([
 ['capacity', 'округление вверх', '200,00 RUB'],
 ['per_day', '2 дней', '200,00 RUB'],
 ['per_person_per_day', '2 дней', '600,00 RUB'],
 ['manual', '100 RUB', '100,00 RUB'],
 ['hotel', 'ночи с 2026-10-01 по 2026-10-03', '400,00 RUB'],
] as const)('the %s formula uses the calculated total', async (mode, factor, total) => {
 const day = emptyDay('2026-10-01'), next = emptyDay('2026-10-02');
 const item = { ...newItem('flight', day, 'RUB', day.date), calculation_mode: mode, unit_price: '100', quantity: '1', capacity: 2, duration_days: 2, check_in: day.date, check_out: '2026-10-03' };
 const trip = { ...newTrip(), participants: 3, start_date: day.date, end_date: next.date, days: [day, next], items: [item], rates: [] };
 render(<ItemForm initial={item} trip={trip} onSubmit={vi.fn()} onCancel={vi.fn()} />);
 await userEvent.click(screen.getByText('Стоимость', { selector: 'summary span' }));
 expect(screen.getByText((text) => text.startsWith('Расчёт:') && text.includes(factor) && text.includes(total))).toBeVisible();
});

import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, test, vi } from 'vitest';
import { ItemForm } from '@/components/trips/item-form';
import { base, trip } from './fixtures';
import { ValidationIssueContext } from '@/components/trips/trip-validation-panel';
import { newItem } from '@/lib/trip-ui';

afterEach(cleanup);

test('opening and saving a populated legacy event preserves every stored field', async () => {
  const item = { ...base, start_time: '19:50:12.123456', end_time: '06:23:45.654321', unit_price: '1050.0000', quantity: '1.000', participants_override: 3,
    stages: [{ id: 'legacy-stage', title: 'Посадка', start_time: '19:20:10.123456', end_time: null, notes: 'Документы', location: 'Вокзал', address: 'Адрес', map_url: 'https://example.com/map' }] };
  const onSubmit = vi.fn();
  render(<ItemForm initial={item} trip={{ ...trip, items: [item] }} playgroundCompact onCancel={() => {}} onSubmit={onSubmit} />);
  await userEvent.click(screen.getByRole('button', { name: 'Сохранить' }));
  expect(onSubmit).toHaveBeenCalledWith(item, undefined);
});

test('switching between saved foreign currencies keeps the selected existing rate', async () => {
  const item = { ...base, currency: 'EUR' };
  const onSubmit = vi.fn();
  const onDirtyChange = vi.fn();
  const user = userEvent.setup();
  render(<ItemForm initial={item} trip={{ ...trip, rates: [{ currency: 'EUR', rate: '40' }, { currency: 'USD', rate: '35' }], items: [item] }} playgroundCompact onDirtyChange={onDirtyChange} onCancel={() => {}} onSubmit={onSubmit} />);
  await user.click(screen.getByText('Стоимость', { selector: 'strong' }));
  expect(screen.getByLabelText('Курс EUR')).toHaveValue('40');
  await user.selectOptions(screen.getByLabelText('Валюта цены'), 'USD');
  expect(screen.getByLabelText('Курс USD')).toHaveValue('35');
  expect(onDirtyChange).toHaveBeenLastCalledWith(true);
  await user.click(screen.getByRole('button', { name: 'Сохранить' }));
  expect(onSubmit).toHaveBeenCalledWith({ ...item, currency: 'USD' }, undefined);
});

test.each(['flight', 'train_bus', 'transfer', 'hotel', 'excursion', 'activity', 'rental', 'insurance', 'meal', 'other'] as const)('compact %s preserves an unchanged saved item', async type => {
  const item = { ...newItem(type, trip.days[0], trip.base_currency, trip.start_date), title: `Событие ${type}`, internal_note: 'Внутренняя заметка', client_note: 'Клиентская заметка' };
  const onSubmit = vi.fn();
  render(<ItemForm initial={item} trip={{ ...trip, items: [item] }} playgroundCompact onCancel={() => {}} onSubmit={onSubmit} />);
  await userEvent.click(screen.getByRole('button', { name: 'Сохранить' }));
  expect(onSubmit).toHaveBeenCalledWith(item, undefined);
});

test('a new event exposes required type choice and opens its main sections', async () => {
  const item = newItem('other', trip.days[0], trip.base_currency, trip.start_date);
  render(<ItemForm initial={item} trip={trip} requireTypeChoice playgroundCompact onCancel={() => {}} onSubmit={() => {}} />);
  expect(screen.getByLabelText('Тип события')).toBeVisible();
  expect(screen.getByRole('button', { name: 'Сохранить' })).toBeDisabled();
  for (const title of ['Маршрут', 'Расписание', 'Стоимость']) {
    expect(screen.getByText(title, { selector: 'strong' }).closest('details')).toHaveAttribute('open');
  }
  await userEvent.selectOptions(screen.getByLabelText('Тип события'), 'activity');
  expect(screen.getByRole('button', { name: 'Сохранить' })).toBeEnabled();
});

test('hotel summaries and saved pricing warning reflect the stay', () => {
  const item = { ...base, type: 'hotel' as const, calculation_mode: 'per_person_per_day' as const, check_in: '2026-11-03', check_out: '2026-11-05', check_in_time: '15:00', check_out_time: '11:00', duration_days: 1 };
  render(<ItemForm initial={item} trip={{ ...trip, items: [item] }} playgroundCompact onCancel={() => {}} onSubmit={() => {}} />);
  const summary = screen.getByRole('group', { name: 'Сводка события' });
  expect(summary).toHaveTextContent('3 ноября, 15:00');
  expect(summary).toHaveTextContent('5 ноября, 11:00');
  const schedule = screen.getByText('Расписание', { selector: 'strong' }).closest('details')!;
  expect(within(schedule.querySelector('summary')!).getByText(/5 ноября, 11:00/)).toBeInTheDocument();
  expect(screen.getByText(/В сохранённом расчёте указано 1 дней/)).toBeInTheDocument();
});

test.each(['meal', 'insurance'] as const)('compact %s can add and save its first stage', async type => {
  const user = userEvent.setup();
  const item = { ...base, type, stages: [] };
  const onSubmit = vi.fn();
  render(<ItemForm initial={item} trip={{ ...trip, items: [item] }} playgroundCompact onCancel={() => {}} onSubmit={onSubmit} />);
  await user.click(screen.getByText('Дополнительные настройки', { selector: 'strong' }));
  await user.click(screen.getByRole('button', { name: 'Добавить этап' }));
  await user.type(screen.getByLabelText('Название этапа 1'), 'Обед');
  await user.click(screen.getByRole('button', { name: 'Сохранить' }));
  expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ stages: [expect.objectContaining({ title: 'Обед' })] }), undefined);
});

test('validation navigation opens a nested compact stage and focuses its field', async () => {
  const stage = { id: 'stage', title: 'Обед', start_time: null, end_time: null, notes: '' };
  const item = { ...base, type: 'meal' as const, stages: [stage] };
  const issue = { id: 'stage', code: 'stage', category: 'schedule', severity: 'warning', title: 'Этап', message: 'Проверьте этап', path: 'items/0/stages/0/title' };
  render(<ValidationIssueContext issue={issue} location={{ section: 'stages', stageId: stage.id, field: 'stages.0.title' }} stale={false}><ItemForm initial={item} trip={{ ...trip, items: [item] }} playgroundCompact onCancel={() => {}} onSubmit={() => {}} /></ValidationIssueContext>);
  const field = await screen.findByLabelText('Название этапа 1');
  await screen.findByText('Проверьте этап');
  expect(field).toHaveFocus();
  expect(field.closest('details')).toHaveAttribute('open');
  expect(screen.getByText('Дополнительные настройки', { selector: 'strong' }).closest('details')).toHaveAttribute('open');
});

test('saving an unchanged hotel preserves a stored pricing duration that differs from its nights', async () => {
  const item = { ...base, type: 'hotel' as const, calculation_mode: 'per_person_per_day' as const, check_in: '2026-11-03', check_out: '2026-11-05', check_in_time: '15:00', check_out_time: '11:00', duration_days: 1 };
  const onSubmit = vi.fn();
  render(<ItemForm initial={item} trip={{ ...trip, items: [item] }} playgroundCompact onCancel={() => {}} onSubmit={onSubmit} />);
  await userEvent.click(screen.getByRole('button', { name: 'Сохранить' }));
  expect(onSubmit).toHaveBeenCalledWith(item, undefined);
});

test('editing hotel dates and hours saves the stay and recalculates its nightly duration', async () => {
  const item = { ...base, type: 'hotel' as const, calculation_mode: 'per_person_per_day' as const, check_in: '2026-11-03', check_out: '2026-11-04', check_in_time: '15:00', check_out_time: '11:00', duration_days: 1 };
  const onSubmit = vi.fn();
  const user = userEvent.setup();
  render(<ItemForm initial={item} trip={{ ...trip, items: [item] }} playgroundCompact onCancel={() => {}} onSubmit={onSubmit} />);
  await user.click(screen.getByText('Расписание', { selector: 'strong' }));
  const checkIn = screen.getByRole('group', { name: 'Заезд' });
  const checkOut = screen.getByRole('group', { name: 'Выезд' });
  await user.clear(within(checkOut).getByLabelText('Дата'));
  await user.type(within(checkOut).getByLabelText('Дата'), '2026-11-05');
  await user.clear(within(checkIn).getByLabelText('Местное время'));
  await user.type(within(checkIn).getByLabelText('Местное время'), '16:30');
  await user.clear(within(checkOut).getByLabelText('Местное время'));
  await user.type(within(checkOut).getByLabelText('Местное время'), '10:30');
  await user.click(screen.getByRole('button', { name: 'Сохранить' }));
  expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ check_in: '2026-11-03', check_out: '2026-11-05', check_in_time: '16:30', check_out_time: '10:30', duration_days: 2 }), undefined);
});

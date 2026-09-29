import Decimal from "decimal.js";
import type { Calculation, Category, ItemType, TripInput } from "./contracts";

const D = Decimal.clone({ precision: 48, rounding: Decimal.ROUND_HALF_UP });
const types: ItemType[] = ["flight", "train_bus", "transfer", "hotel", "excursion", "activity", "rental", "insurance", "other"];
const category: Record<ItemType, Category> = { flight: "transport", train_bus: "transport", transfer: "transport", rental: "transport", hotel: "accommodation", excursion: "activities", activity: "activities", insurance: "other", other: "other" };
const money = (value: Decimal) => {
  if (!value.isFinite() || value.isNegative() || value.gt("999999999999999999.99")) throw new Error("Сумма выходит за допустимые пределы");
  return value.toFixed(2);
};
function decimal(value: string, name: string, max: string, places: number, positive = false) {
  if (!/^\d+(\.\d+)?$/.test(value)) throw new Error(`${name}: введите число`);
  const n = new D(value);
  if (!n.isFinite() || n.lt(0) || (positive && n.isZero()) || n.gt(max) || n.decimalPlaces() > places) throw new Error(`${name}: недопустимое значение`);
  return n;
}
function integer(value: number | null, name: string, max = 10000): number {
  if (value === null || !Number.isInteger(value) || value <= 0 || value > max) throw new Error(`${name}: укажите целое положительное число`);
  return value;
}
export function dateList(start: string, end: string): string[] {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(start) || !/^\d{4}-\d{2}-\d{2}$/.test(end)) throw new Error("Укажите даты поездки");
  const first = Date.parse(`${start}T00:00:00Z`), last = Date.parse(`${end}T00:00:00Z`);
  if (!Number.isFinite(first) || !Number.isFinite(last) || last < first || last - first > 3659 * 86400000) throw new Error("Проверьте диапазон дат поездки (не более 3660 дней)");
  return Array.from({ length: (last - first) / 86400000 + 1 }, (_, i) => new Date(first + i * 86400000).toISOString().slice(0, 10));
}
export function nextDate(date: string) { return new Date(Date.parse(`${date}T00:00:00Z`) + 86400000).toISOString().slice(0, 10); }

function dailyPortions(amount: Decimal, count: number): Decimal[] {
  if (count === 1) return [amount];
  const equal = D.min(amount.div(count).toDecimalPlaces(2), amount.div(count - 1).toDecimalPlaces(2, Decimal.ROUND_DOWN));
  return Array.from({ length: count }, (_, index) => index === count - 1 ? amount.minus(equal.mul(count - 1)) : equal);
}

/** Local estimate only. The persisted server calculation remains authoritative. */
export function calculateTrip(trip: TripInput): Calculation {
  integer(trip.participants, "Число участников");
  dateList(trip.start_date, trip.end_date);
  if (!/^[A-Z]{3}$/.test(trip.base_currency)) throw new Error("Валюта: укажите код из трёх латинских букв");
  const percent = decimal(trip.pricing_percent, "Процент", "10000", 4);
  if (trip.pricing_mode === "target_margin" && percent.gte(100)) throw new Error("Целевая маржинальность должна быть меньше 100%");
  const rates = new Map<string, Decimal>();
  for (const rate of trip.rates) {
    if (!/^[A-Z]{3}$/.test(rate.currency) || rates.has(rate.currency)) throw new Error("Проверьте коды валют: каждая валюта должна встречаться один раз");
    const value = decimal(rate.rate, `Курс ${rate.currency}`, "1000000", 8, true);
    if (rate.currency === trip.base_currency && !value.equals(1)) throw new Error("Курс базовой валюты должен быть равен 1");
    rates.set(rate.currency, value);
  }
  rates.set(trip.base_currency, new D(1));
  const byType = Object.fromEntries(types.map(t => [t, new D(0)])) as Record<ItemType, Decimal>;
  const days = trip.days.filter(d => d.date >= trip.start_date && d.date <= trip.end_date).sort((a, b) => a.date.localeCompare(b.date)).map(day => ({ day_id: day.id, date: day.date, groups: { transport: new D(0), accommodation: new D(0), activities: new D(0), other: new D(0) }, total: new D(0) }));
  let general = new D(0), cost = new D(0);
  const items = trip.items.map(item => {
    const price = decimal(item.unit_price, `${item.title}: цена`, "999999999999", 2);
    const quantity = decimal(item.quantity, `${item.title}: количество`, "10000", 4, true);
    if (!rates.has(item.currency)) throw new Error(`Укажите курс ${item.currency}: сколько ${trip.base_currency} стоит 1 ${item.currency}`);
    const people = item.participants_override === null ? trip.participants : integer(item.participants_override, "Участники элемента");
    if (people > trip.participants) throw new Error(`${item.title}: участников больше, чем в поездке. Исправьте подгруппу.`);
    let amount: Decimal, nights: string[] = [];
    switch (item.calculation_mode) {
      case "per_person": amount = price.mul(people).mul(quantity); break;
      case "fixed": amount = price.mul(quantity); break;
      case "capacity": amount = price.mul(new D(people).div(integer(item.capacity, "Вместимость")).ceil()).mul(quantity); break;
      case "per_day": amount = price.mul(integer(item.duration_days, "Число дней", 3660)).mul(quantity); break;
      case "per_person_per_day": amount = price.mul(people).mul(integer(item.duration_days, "Число дней", 3660)).mul(quantity); break;
      case "manual": amount = price; break;
      case "hotel": {
        if (!item.check_in || !item.check_out || item.check_in >= item.check_out || item.check_in < trip.start_date || item.check_out > nextDate(trip.end_date)) throw new Error(`${item.title}: проверьте заезд и выезд в пределах поездки`);
        if (item.day_id && trip.days.find(d => d.id === item.day_id)?.date !== item.check_in) throw new Error(`${item.title}: выберите день заезда или общие расходы`);
        nights = dateList(item.check_in, item.check_out).slice(0, -1);
        const rooms = item.rooms_override === null ? new D(people).div(integer(item.capacity, "Гостей в номере")).ceil() : new D(integer(item.rooms_override, "Число номеров"));
        amount = price.mul(rooms).mul(nights.length); break;
      }
      default: throw new Error("Выберите правило расчёта");
    }
    amount = amount.toDecimalPlaces(2);
    const rate = rates.get(item.currency)!;
    const normalized = amount.mul(rate).toDecimalPlaces(2);
    const snapshot = { id: item.id, original_amount: money(amount), rate_used: rate.toString(), normalized_amount: money(normalized) };
    if ((item.calculation_mode === "per_day" || item.calculation_mode === "per_person_per_day") && item.day_id) {
      const start = days.findIndex(day => day.day_id === item.day_id);
      if (start < 0) throw new Error(`${item.title}: день находится вне поездки`);
      if (start + item.duration_days > days.length) throw new Error(`${item.title}: число дней выходит за пределы поездки. Уменьшите длительность, выберите более ранний день или продлите поездку`);
    }
    if (!item.included) return snapshot;
    cost = cost.plus(normalized); byType[item.type] = byType[item.type].plus(normalized);
    const addDay = (day: typeof days[number], share: Decimal) => { day.total = day.total.plus(share); day.groups[category[item.type]] = day.groups[category[item.type]].plus(share); };
    if (nights.length) {
      const portions = dailyPortions(normalized, nights.length);
      nights.forEach((night, i) => {
        const day = days.find(d => d.date === night);
        if (!day) throw new Error("Не найдены дни проживания. Сохраните даты поездки.");
        addDay(day, portions[i]);
      });
    } else if ((item.calculation_mode === "per_day" || item.calculation_mode === "per_person_per_day") && item.day_id) {
      const start = days.findIndex(day => day.day_id === item.day_id);
      dailyPortions(normalized, item.duration_days).forEach((portion, offset) => addDay(days[start + offset], portion));
    } else if (item.day_id) {
      const day = days.find(d => d.day_id === item.day_id);
      if (!day) throw new Error(`${item.title}: день находится вне поездки`);
      addDay(day, normalized);
    } else general = general.plus(normalized);
    return snapshot;
  });
  const price = (trip.pricing_mode === "markup" ? cost.mul(new D(1).plus(percent.div(100))) : cost.div(new D(1).minus(percent.div(100)))).toDecimalPlaces(2);
  const profit = price.minus(cost);
  return { items, days: days.map(d => ({ ...d, total: money(d.total), groups: Object.fromEntries(Object.entries(d.groups).map(([k, v]) => [k, money(v)])) as Record<Category, string> })), by_type: Object.fromEntries(types.map(t => [t, money(byType[t])])) as Record<ItemType, string>, general_total: money(general), cost_total: money(cost), cost_per_person: money(cost.div(trip.participants)), client_price: money(price), profit: money(profit), actual_margin_percent: price.isZero() ? "0" : profit.div(price).mul(100).toDecimalPlaces(4).toString() };
}

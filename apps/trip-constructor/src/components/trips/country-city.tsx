"use client";

import { useEffect, useState } from "react";
import { countries } from "@/lib/countries";
import { mapsClient } from "@/lib/maps-client";
import { PlaceCombobox, type PlaceOption } from "./place-combobox";

type CityOption = PlaceOption & { countryCode: string | null };
export interface PreviousFlightPlace { countryCode: string; city: string }

export function CountryCity({
  label,
  country,
  city,
  history = [],
  onChange,
}: {
  label: string;
  country: string | null;
  city: string;
  history?: PreviousFlightPlace[];
  onChange: (country: string | null, city: string) => void;
}) {
  const [query, setQuery] = useState(city);
  const [options, setOptions] = useState<CityOption[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const [countryRequired, setCountryRequired] = useState(false);

  useEffect(() => {
    if (query.trim().length < 2 || query === city) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      setBusy(true);
      setError(false);
      void mapsClient.searchCities(query.trim(), country, controller.signal).then(({ places }) => {
        if (!controller.signal.aborted) {
          const countryCodes = new Set(countries.map(option => option.key));
          setOptions(places.filter(place => countryCodes.has(place.country_code)).map((place, index) => ({
            key: `search:${index}`,
            label: place.name,
            description: place.address,
            countryCode: place.country_code,
          })));
        }
      }, () => {
        if (!controller.signal.aborted) {
          setOptions([]);
          setError(true);
        }
      }).finally(() => {
        if (!controller.signal.aborted) setBusy(false);
      });
    }, 350);
    return () => {
      clearTimeout(timer);
      controller.abort();
      setBusy(false);
    };
  }, [query, country, city]);

  const countryNames = new Map(countries.map(option => [option.key, option.label]));
  const seenPlaces = new Set<string>();
  const historyPlaces = history.flatMap(place => {
    const countryCode = place.countryCode.toUpperCase();
    const cityName = place.city.trim().slice(0, 120);
    if (!cityName || !countryNames.has(countryCode)) return [];
    const pair = `${countryCode}\u0000${cityName.toLocaleLowerCase("ru")}`;
    if (seenPlaces.has(pair)) return [];
    seenPlaces.add(pair);
    return [{ countryCode, city: cityName }];
  });
  const historyCountries = [...new Set(historyPlaces.map(place => place.countryCode))].map(code => ({
    key: code,
    label: countryNames.get(code)!,
    description: code,
    group: "Из этой поездки",
  }));
  const historyCountryCodes = new Set(historyCountries.map(option => option.key));
  const countryOptions = [
    { key: "", label: "Без страны" },
    ...historyCountries,
    ...countries.filter(option => !historyCountryCodes.has(option.key)),
  ];

  const selected: CityOption | null = city ? { key: "selected", label: city, countryCode: country } : null;
  const historyCityOptions: CityOption[] = historyPlaces
    .filter(place => place.countryCode !== country || place.city.toLocaleLowerCase("ru") !== city.toLocaleLowerCase("ru"))
    .map(place => ({
      key: `history:${place.countryCode}:${place.city}`,
      label: place.city,
      description: countryNames.get(place.countryCode),
      group: "Из других перелётов",
      countryCode: place.countryCode,
    }));
  const cityOptions = [...(selected ? [selected] : []), ...historyCityOptions, ...options];

  return (
    <fieldset className="field-wide" style={{ minWidth: 0, border: 0, padding: 0, margin: 0 }} aria-label={label}>
      <legend>{label}</legend>
      <div className="form-grid">
        <PlaceCombobox
          label={`${label} — страна`}
          value={country}
          options={countryOptions}
          onChange={key => {
            if (key === (country ?? "")) return;
            setQuery(city ? "" : query);
            setOptions([]);
            setError(false);
            setBusy(false);
            setCountryRequired(false);
            onChange(key || null, "");
          }}
          placeholder="Найдите страну"
        />
        <div>
          <PlaceCombobox
            label={`${label} — город`}
            value={city ? "selected" : null}
            options={cityOptions}
            inputValue={query}
            onInputChange={value => {
              setQuery(value.slice(0, 120));
              setOptions([]);
              setError(false);
              setCountryRequired(false);
              setBusy(false);
            }}
            filterOptions={false}
            busy={busy}
            allowCustom
            onCustomValue={value => {
              if (!country) {
                setCountryRequired(true);
                return;
              }
              setCountryRequired(false);
              onChange(country, value.slice(0, 120));
              setQuery(value.slice(0, 120));
              setOptions([]);
            }}
            onChange={key => {
              const option = key === "selected" ? selected : cityOptions.find(item => item.key === key);
              if (!option) return;
              onChange(option.countryCode, option.label.slice(0, 120));
              setQuery(option.label.slice(0, 120));
              setOptions([]);
            }}
            placeholder="Найдите город"
            emptyText={query.trim().length < 2 ? "Введите хотя бы две буквы" : "Город не найден. Можно использовать своё название."}
          />
          {error && <p role="status" className="field-hint">Не удалось найти города. Повторите ввод или используйте своё название.</p>}
          {countryRequired && <p role="status" className="field-hint">Выберите страну, чтобы сохранить свободный город.</p>}
        </div>
      </div>
      {country && city && <p className="field-hint">При выборе другой страны город сбросится. Аэропорт выбирается отдельно.</p>}
    </fieldset>
  );
}

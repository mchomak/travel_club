from datetime import date, datetime, time
from decimal import Decimal
from typing import Annotated, Literal, get_args
from urllib.parse import urlsplit
from uuid import UUID, uuid4

from pydantic import (
    AnyHttpUrl,
    BaseModel,
    BeforeValidator,
    ConfigDict,
    Field,
    TypeAdapter,
    ValidationError,
    field_validator,
    model_validator,
)

ItemType = Literal[
    "flight",
    "train_bus",
    "transfer",
    "hotel",
    "excursion",
    "activity",
    "rental",
    "insurance",
    "meal",
    "other",
]
ItemSubtype = Literal[
    "bus", "train", "taxi", "rental", "water", "restaurant", "cafe", "bar",
    "street_food", "excursion", "activity", "insurance", "sim", "communication",
    "visa_fee", "service_fee", "other",
]
SUBTYPES_BY_TYPE: dict[str, set[str]] = {
    "train_bus": {"bus", "train", "other"},
    "transfer": {"bus", "train", "taxi", "rental", "water", "other"},
    "rental": {"bus", "train", "taxi", "rental", "water", "other"},
    "meal": {"restaurant", "cafe", "bar", "street_food", "other"},
    "excursion": {"excursion", "activity", "other"},
    "activity": {"excursion", "activity", "other"},
    "insurance": {"insurance", "other"},
    "other": {"insurance", "sim", "communication", "visa_fee", "service_fee", "other"},
}
CalculationMode = Literal[
    "per_person", "fixed", "capacity", "hotel", "per_day", "per_person_per_day", "manual"
]
PricingMode = Literal["markup", "target_margin"]
TripStatus = Literal["draft", "ready", "archived"]
Category = Literal["transport", "accommodation", "activities", "other"]


def decimal_input(value):
    if isinstance(value, (float, bool)):
        raise ValueError("Передайте денежное значение строкой, например 100.00")
    return value


Money = Annotated[
    Decimal,
    BeforeValidator(decimal_input),
    Field(
        ge=0,
        le=Decimal("999999999999999999.99"),
        max_digits=20,
        decimal_places=2,
        allow_inf_nan=False,
    ),
]
UnitPrice = Annotated[
    Decimal,
    BeforeValidator(decimal_input),
    Field(ge=0, le=Decimal("999999999999"), max_digits=20, decimal_places=2, allow_inf_nan=False),
]
Rate = Annotated[
    Decimal,
    BeforeValidator(decimal_input),
    Field(gt=0, le=Decimal("1000000"), max_digits=20, decimal_places=8, allow_inf_nan=False),
]
Quantity = Annotated[
    Decimal,
    BeforeValidator(decimal_input),
    Field(gt=0, le=Decimal("10000"), max_digits=14, decimal_places=4, allow_inf_nan=False),
]
Percent = Annotated[
    Decimal,
    BeforeValidator(decimal_input),
    Field(ge=0, le=Decimal("10000"), max_digits=10, decimal_places=4, allow_inf_nan=False),
]
Currency = Annotated[str, Field(pattern=r"^[A-Z]{3}$")]
People = Annotated[int, Field(strict=True, gt=0, le=10000)]
Note = Annotated[str, Field(max_length=10000)]
Title = Annotated[str, Field(min_length=1, max_length=200)]


class DTO(BaseModel):
    model_config = ConfigDict(extra="forbid", from_attributes=True)


class UserInfo(DTO):
    id: UUID
    login: str


class LoginInput(DTO):
    login: str = Field(min_length=1, max_length=120)
    password: str = Field(min_length=1, max_length=1024)


class PasswordChangeInput(DTO):
    current_password: str = Field(min_length=1, max_length=1024)
    new_password: str = Field(min_length=12, max_length=1024)


class DayInput(DTO):
    id: UUID = Field(default_factory=uuid4)
    date: date
    country: str = Field(default="", max_length=120)
    city: str = Field(default="", max_length=120)
    place: str = Field(default="", max_length=200)
    title: str = Field(default="", max_length=200)
    status: str = Field(default="", max_length=200)
    internal_note: Note = ""
    client_note: Note = ""


class ItemInput(DTO):
    id: UUID = Field(default_factory=uuid4)
    day_id: UUID | None = None
    end_day_id: UUID | None = None
    position: int = Field(default=0, ge=0, le=10000, strict=True)
    type: ItemType
    subtype: ItemSubtype | None = None
    airport_before_minutes: int = Field(default=180, ge=0, le=1440, strict=True)
    airport_after_minutes: int = Field(default=60, ge=0, le=1440, strict=True)
    calculation_mode: CalculationMode
    title: Title
    description: Note = ""
    location: str = Field(default="", max_length=200)
    start_time: time | None = None
    end_time: time | None = None
    external_url: str | None = Field(default=None, max_length=2048)
    internal_note: Note = ""
    client_note: Note = ""
    included: bool = True
    currency: Currency
    unit_price: UnitPrice = Decimal(0)
    quantity: Quantity = Decimal(1)
    participants_override: People | None = None
    capacity: People | None = None
    rooms_override: People | None = None
    duration_days: int = Field(default=1, gt=0, le=3660, strict=True)
    check_in: date | None = None
    check_out: date | None = None
    check_in_time: time | None = None
    check_out_time: time | None = None

    @model_validator(mode="after")
    def valid_subtype(self):
        if self.subtype is not None and self.subtype not in SUBTYPES_BY_TYPE.get(self.type, set()):
            raise ValueError("Выберите допустимый подвид для категории пункта")
        return self

    @field_validator("external_url")
    @classmethod
    def valid_external_url(cls, value: str | None) -> str | None:
        if value is None or value == "":
            return None
        try:
            parsed = TypeAdapter(AnyHttpUrl).validate_python(value)
        except ValidationError:
            raise ValueError("Введите полную ссылку http:// или https:// с адресом сайта") from None
        parts = urlsplit(value)
        if (
            not parts.netloc
            or not parts.hostname
            or any(char.isspace() for char in value)
            or parsed.username
            or parsed.password
        ):
            raise ValueError("Введите полную ссылку http:// или https:// с адресом сайта")
        return value


class CurrencyRateInput(DTO):
    currency: Currency
    rate: Rate


class TripCreate(DTO):
    internal_title: Title
    client_title: str = Field(default="", max_length=200)
    start_date: date
    end_date: date
    participants: People
    base_currency: Currency = "RUB"
    internal_note: Note = ""
    client_note: Note = ""
    status: TripStatus = "draft"
    pricing_mode: PricingMode = "markup"
    pricing_percent: Percent = Decimal(0)

    @model_validator(mode="after")
    def validate_trip_fields(self):
        if self.start_date > self.end_date:
            raise ValueError("Дата окончания должна быть не раньше даты начала")
        if (self.end_date - self.start_date).days > 3659:
            raise ValueError("Поездка не может длиться больше 3660 дней")
        if self.pricing_mode == "target_margin" and self.pricing_percent >= 100:
            raise ValueError("Целевая маржинальность должна быть меньше 100%")
        return self


class TripInput(TripCreate):
    days: list[DayInput] = Field(default_factory=list, max_length=3660)
    items: list[ItemInput] = Field(default_factory=list, max_length=10000)
    rates: list[CurrencyRateInput] = Field(default_factory=list, max_length=1000)


class TripUpdate(TripInput):
    version: int = Field(gt=0, strict=True)


class ItemCalculation(DTO):
    id: UUID
    original_amount: Money
    rate_used: Rate
    normalized_amount: Money


class DayCalculation(DTO):
    day_id: UUID
    date: date
    groups: dict[Category, Money]
    total: Money

    @model_validator(mode="after")
    def complete_groups(self):
        if set(self.groups) != set(get_args(Category)):
            raise ValueError("Дневная смета должна содержать все группы расходов")
        return self


class Calculation(DTO):
    items: list[ItemCalculation]
    days: list[DayCalculation]
    by_type: dict[ItemType, Money]
    general_total: Money
    cost_total: Money
    cost_per_person: Money
    client_price: Money
    profit: Money
    actual_margin_percent: Percent

    @model_validator(mode="after")
    def complete_types(self):
        if set(self.by_type) != set(get_args(ItemType)):
            raise ValueError("Смета должна содержать все типы расходов")
        return self


class ItemDocument(ItemInput):
    original_amount: Money
    rate_used: Rate
    normalized_amount: Money


class TripDocument(TripInput):
    id: UUID
    version: int
    created_by: UUID
    created_at: datetime
    updated_at: datetime
    items: list[ItemDocument]
    calculation: Calculation


class TripSummary(DTO):
    id: UUID
    internal_title: str
    start_date: date
    end_date: date
    participants: int
    base_currency: Currency
    status: TripStatus
    countries: list[str]
    cities: list[str]
    cost_total: Money
    client_price: Money
    updated_at: datetime
    version: int


class PreviewItem(DTO):
    id: UUID
    type: ItemType
    subtype: ItemSubtype | None
    title: str
    description: str
    location: str
    start_time: time | None
    end_time: time | None
    client_note: str


class PreviewDay(DTO):
    id: UUID
    date: date
    country: str
    city: str
    place: str
    title: str
    client_note: str
    items: list[PreviewItem]


class ClientPreview(DTO):
    id: UUID
    client_title: str
    start_date: date
    end_date: date
    participants: int
    client_note: str
    days: list[PreviewDay]
    general_items: list[PreviewItem]

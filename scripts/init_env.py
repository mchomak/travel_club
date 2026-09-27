"""Generate only the database secret locally; never print it or overwrite an existing file."""
from pathlib import Path
import secrets

target = Path(__file__).resolve().parents[1] / ".env"
template = target.with_name(".env.example").read_text(encoding="utf-8")
try:
    with target.open("x", encoding="utf-8") as output:
        output.write(template.replace("replace-locally", secrets.token_urlsafe(48)))
except FileExistsError:
    print(".env already exists; it was not changed.")
else:
    print("Created local .env. No administrator account has been created.")

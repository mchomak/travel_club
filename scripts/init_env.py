"""Generate local database credentials without printing or overwriting existing files."""
import argparse
from pathlib import Path
import secrets

root = Path(__file__).resolve().parents[1]


def create_if_missing(target: Path, contents: str, message: str) -> bool:
    try:
        with target.open("x", encoding="utf-8") as output:
            output.write(contents)
    except FileExistsError:
        print(f"{target.name} already exists; existing values will be preserved.")
        return False
    else:
        print(message)
        return True


def extend_missing_settings(target: Path, contents: str) -> None:
    # Keep prior values intact while adding settings introduced by newer releases.
    # Environment files are never printed and root .env is never read here.
    existing = target.read_text(encoding="utf-8")
    existing_keys = {
        line.split("=", 1)[0]
        for line in existing.splitlines()
        if "=" in line and not line.lstrip().startswith("#")
    }
    missing_lines = [
        line
        for line in contents.splitlines()
        if "=" in line
        and not line.lstrip().startswith("#")
        and line.split("=", 1)[0] not in existing_keys
    ]
    if missing_lines:
        with target.open("a", encoding="utf-8") as output:
            if existing and not existing.endswith(("\n", "\r")):
                output.write("\n")
            output.write("\n".join(missing_lines) + "\n")
        print(f"Updated {target.name} with new settings; existing values were preserved.")


def generate_check_env() -> None:
    target = root / ".env.website.check"
    template = (root / ".env.website.check.example").read_text(encoding="utf-8")
    credentials = {
        "replace-check-website-postgres-admin-locally": secrets.token_urlsafe(48),
        "replace-check-website-app-locally": secrets.token_urlsafe(48),
        "replace-check-website-migrator-locally": secrets.token_urlsafe(48),
        "replace-check-website-receipt-secret-locally": secrets.token_urlsafe(48),
        "replace-check-website-rate-secret-locally": secrets.token_urlsafe(48),
    }
    for placeholder, credential in credentials.items():
        template = template.replace(placeholder, credential)
    if not create_if_missing(
        target,
        template,
        "Created .env.website.check for disposable Website database checks.",
    ):
        extend_missing_settings(target, template)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--website-check",
        action="store_true",
        help="also create .env.website.check for disposable integration checks",
    )
    args = parser.parse_args()

    env_target = root / ".env"
    env_template = (root / ".env.example").read_text(encoding="utf-8")
    create_if_missing(
        env_target,
        env_template.replace("replace-locally", secrets.token_urlsafe(48)),
        "Created local .env. No administrator account has been created.",
    )

    website_target = root / ".env.website"
    website_template = (root / ".env.website.example").read_text(encoding="utf-8")
    website_credentials = {
        "replace-website-postgres-admin-locally": secrets.token_urlsafe(48),
        "replace-website-app-locally": secrets.token_urlsafe(48),
        "replace-website-migrator-locally": secrets.token_urlsafe(48),
        "replace-website-receipt-secret-locally": secrets.token_urlsafe(48),
        "replace-website-rate-secret-locally": secrets.token_urlsafe(48),
    }
    for placeholder, credential in website_credentials.items():
        website_template = website_template.replace(placeholder, credential)
    created = create_if_missing(
        website_target,
        website_template,
        "Created .env.website with independent Website database credentials.",
    )
    if not created:
        extend_missing_settings(website_target, website_template)

    if args.website_check:
        generate_check_env()


if __name__ == "__main__":
    main()

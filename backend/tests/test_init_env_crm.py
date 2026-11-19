import importlib.util
import sys
from pathlib import Path


def test_init_generates_and_preserves_private_crm_secret(tmp_path, monkeypatch, capsys):
    script = Path(__file__).resolve().parents[2] / "scripts" / "init_env.py"
    spec = importlib.util.spec_from_file_location("init_env_crm_test", script)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    monkeypatch.setattr(module, "root", tmp_path)
    monkeypatch.setattr(sys, "argv", ["init_env.py"])
    (tmp_path / ".env.example").write_text("POSTGRES_PASSWORD=replace-locally\n", encoding="utf-8")
    (tmp_path / ".env.website.example").write_text("WEBSITE_DATABASE_URL=test\n", encoding="utf-8")
    module.main()
    env_file = tmp_path / ".env"
    secret_line = next(
        line
        for line in env_file.read_text().splitlines()
        if line.startswith("WEBSITE_ADMIN_SECRET=")
    )
    assert len(secret_line.split("=", 1)[1]) >= 32
    assert secret_line not in capsys.readouterr().out
    module.main()
    assert env_file.read_text().splitlines().count(secret_line) == 1
    assert secret_line not in capsys.readouterr().out

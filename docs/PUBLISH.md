# Завершение сдачи на GitHub

Доступные инструменты не создают новый публичный репозиторий GitHub. Ниже оставшиеся действия. Сайт и история уже подготовлены; фамилия и имя для окончательного названия не предоставлены.

1. Установи Git, если он отсутствует. На GitHub создай **публичный пустой** репозиторий `surname-name-fullstack-frontend`. Замени surname и name своими данными латиницей. Не добавляй автоматически README, лицензию или .gitignore: они уже входят в историю.
2. В папке, где находится repository.bundle, открой терминал. Замени значения в командах:

```bash
git clone repository.bundle surname-name-fullstack-frontend
cd surname-name-fullstack-frontend
git remote remove origin
git remote add origin https://github.com/YOUR_LOGIN/surname-name-fullstack-frontend.git
git push -u origin main
```

Git запросит авторизацию GitHub через штатный механизм. Не вставляй пароль или токен в исходники. Проверь вкладку Commits: история должна содержать минимум 5 коммитов. Коммиты созданы последовательно по этапам работы, без подмены дат.

3. Открой Settings → Pages → Build and deployment → Source → GitHub Actions.
4. Открой Actions → Publish static frontend to GitHub Pages → Run workflow. Дождись зелёного результата. Если запуска после включения Pages нет, workflow_dispatch позволяет запустить его вручную.
5. Скопируй фактический URL из Settings → Pages. Проверь главную, переходы между страницами, формы и мобильную ширину.
6. Сделай скриншоты по инструкции docs/screenshots/README.md. Добавь их и реальные ссылки в README.
7. Зафиксируй дополнения и отправь:

```bash
git add README.md docs/screenshots
git commit -m "docs: add real screenshots and submission links"
git push
```

Для сдачи отправь преподавателю **две реальные ссылки**: публичный репозиторий и опубликованный GitHub Pages. Приватная демонстрация Sites доступна владельцу и не заменяет их. Поле site project_id и исходный служебный remote не являются ссылками для сдачи.

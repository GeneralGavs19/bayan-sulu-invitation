#!/bin/bash

# Скрипт для быстрой установки всех зависимостей

echo "🚀 Устанавливаем зависимости для Bayan Sulu Invitation..."

echo ""
echo "📦 Бэкенд..."
cd server
npm install
echo "✓ Бэкенд готов"

echo ""
echo "📦 Фронтенд..."
cd ../client
npm install
echo "✓ Фронтенд готов"

echo ""
echo "✨ Все зависимости установлены!"
echo ""
echo "Далее:"
echo "1. Создайте файл server/.env с вашими credentials"
echo "2. Запустите: npm run dev (или npm run server в одном терминале, npm run client в другом)"

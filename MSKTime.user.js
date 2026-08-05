// ==UserScript==
// @name         MSKTime
// @namespace    http://tampermonkey.net/
// @version      2026-08-05
// @description  Показывает текущее время МСК (сделано при помощи Deepseek)
// @author       Chubuk
// @match        https://catwar.su/cw3/*
// @match        https://catwar.net/cw3/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=catwar.su
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // 1. Создаем HTML-элемент для часов
    const clockDiv = document.createElement('div');
    clockDiv.id = 'myMovableClock';
    clockDiv.style.position = 'fixed';
    clockDiv.style.top = '20px';
    clockDiv.style.right = '20px';
    clockDiv.style.background = 'rgba(0, 0, 0, 0.75)';
    clockDiv.style.color = '#ffffff';
    clockDiv.style.padding = '12px 20px';
    clockDiv.style.borderRadius = '10px';
    clockDiv.style.fontFamily = 'monospace';
    clockDiv.style.zIndex = '9999';
    clockDiv.style.cursor = 'grab';
    clockDiv.style.userSelect = 'none';
    clockDiv.style.textAlign = 'center';
    clockDiv.style.boxShadow = '0 4px 15px rgba(0,0,0,0.5)';
    clockDiv.innerHTML = '<div style="font-size:24px; font-weight:bold;">00:00:00</div><div style="font-size:12px; opacity:0.7; margin-top:2px;">00.00.0000 MSK</div>';

    document.body.appendChild(clockDiv);

    // 2. Функция обновления времени и даты (МСК = UTC+3)
    function updateClock() {
        const now = new Date();
        // Получаем время в UTC и прибавляем 3 часа
        const mskTime = new Date(now.getTime() + (3 * 60 * 60 * 1000));

        // Форматируем дату (день.месяц.год)
        const day = String(mskTime.getUTCDate()).padStart(2, '0');
        const month = String(mskTime.getUTCMonth() + 1).padStart(2, '0');
        const year = mskTime.getUTCFullYear();

        // Форматируем время
        const hours = String(mskTime.getUTCHours()).padStart(2, '0');
        const minutes = String(mskTime.getUTCMinutes()).padStart(2, '0');
        const seconds = String(mskTime.getUTCSeconds()).padStart(2, '0');

        // Обновляем содержимое
        clockDiv.innerHTML = `
            <div style="font-size:24px; font-weight:bold;">${hours}:${minutes}:${seconds}</div>
            <div style="font-size:12px; opacity:0.7; margin-top:2px;">${day}.${month}.${year} MSK</div>
        `;
    }

    // Обновляем каждую секунду
    setInterval(updateClock, 1000);
    updateClock();

    // 3. Логика для перетаскивания мышкой
    let isDragging = false;
    let offsetX = 0;
    let offsetY = 0;

    clockDiv.addEventListener('mousedown', (e) => {
        isDragging = true;
        clockDiv.style.cursor = 'grabbing';
        const rect = clockDiv.getBoundingClientRect();
        offsetX = e.clientX - rect.left;
        offsetY = e.clientY - rect.top;
        e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        let newX = e.clientX - offsetX;
        let newY = e.clientY - offsetY;
        const rect = clockDiv.getBoundingClientRect();
        const maxX = window.innerWidth - rect.width;
        const maxY = window.innerHeight - rect.height;
        newX = Math.min(Math.max(0, newX), maxX);
        newY = Math.min(Math.max(0, newY), maxY);
        clockDiv.style.left = newX + 'px';
        clockDiv.style.top = newY + 'px';
        clockDiv.style.right = 'auto';
    });

    document.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            clockDiv.style.cursor = 'grab';
        }
    });

})();

// ==UserScript==
// @name         CatWar Расписание
// @namespace    http://tampermonkey.net/
// @version      4.5
// @description  Блок с расписанием и обратным отсчетом до следующего события (МСК)
// @author       Chubuk (Deepseek)
// @match        https://catwar.su/cw3/*
// @match        https://catwar.net/cw3/*
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    const SCHEDULE_DATA = [
        ['11:00', 'Охотничий патруль'],
        ['12:00', 'Пограничный патруль'],
        ['12:30', 'Водный патруль'],
        ['15:00', 'Охотничий патруль'],
        ['15:50', 'Травник'],
        ['17:00', 'Пограничный патруль'],
        ['17:30', 'Водный патруль'],
        ['18:00', 'Собрание'],
        ['19:30', 'Водный патруль'],
        ['20:00', 'Пограничный патруль'],
        ['21:00', 'Охотничий патруль'],
        ['21:30', 'Водный патруль'],
        ['22:00', 'Пограничный патруль'],
    ];

    let countdownText = null;
    let countdownLi = null;

    // Получаем текущее время по МСК
    function getMoscowTime() {
        const now = new Date();
        const moscowOffset = 3 * 60;
        const localOffset = now.getTimezoneOffset();
        const moscowTime = new Date(now.getTime() + (localOffset + moscowOffset) * 60000);
        return moscowTime;
    }

    function findNextEvent() {
        const now = getMoscowTime();
        // ВАЖНО: создаем дату с началом дня (00:00:00)
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
        
        // Создаем события на сегодня
        const todayEvents = SCHEDULE_DATA.map(([mskTime, event]) => {
            const [hours, minutes] = mskTime.split(':').map(Number);
            const eventDate = new Date(today);
            eventDate.setHours(hours, minutes, 0, 0);
            return { mskTime, event, date: eventDate };
        });
        
        // Сортируем по времени
        todayEvents.sort((a, b) => a.date - b.date);
        
        // Ищем первое событие, которое еще не наступило
        for (const ev of todayEvents) {
            if (ev.date > now) {
                return ev;
            }
        }
        
        // Если все события сегодня прошли, берем первое событие на завтра
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const firstEvent = SCHEDULE_DATA[0];
        const [hours, minutes] = firstEvent[0].split(':').map(Number);
        const eventDate = new Date(tomorrow);
        eventDate.setHours(hours, minutes, 0, 0);
        return { mskTime: firstEvent[0], event: firstEvent[1], date: eventDate };
    }

    function getTimeDiff(targetDate) {
        const now = getMoscowTime();
        const diff = targetDate - now;
        if (diff <= 0) return { hours: 0, minutes: 0, seconds: 0, total: diff };
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        return { hours, minutes, seconds, total: diff };
    }

    function createScheduleBlock() {
        const oldBlock = document.getElementById('catwar-schedule');
        if (oldBlock) oldBlock.remove();
        const oldTr = document.getElementById('catwar-schedule-tr');
        if (oldTr) oldTr.remove();

        const mainTable = document.getElementById('main_table');
        if (!mainTable) return false;

        const tbody = mainTable.querySelector('tbody');
        if (!tbody) return false;

        const trMouth = document.getElementById('tr_mouth');
        if (!trMouth) return false;

        const styleId = 'catwar-grid-style';
        let gridStyle = document.getElementById(styleId);
        if (!gridStyle) {
            gridStyle = document.createElement('style');
            gridStyle.id = styleId;
            document.head.appendChild(gridStyle);
        }
        gridStyle.textContent = `
            #main_table > tbody {
                grid-template:
                    "tr_tos tr_field tr_info"
                    "tr_chat . ."
                    "tr_actions . ."
                    "tr_mouth . ."
                    "catwar-schedule-tr . ."
                    / 1fr auto 1fr !important;
            }
        `;

        const newTr = document.createElement('tr');
        newTr.id = 'catwar-schedule-tr';

        const newTd = document.createElement('td');
        newTd.style.cssText = `
            padding: 0 5px 8px 5px;
            vertical-align: top;
        `;

        const block = document.createElement('div');
        block.id = 'catwar-schedule';
        block.style.cssText = `
            background: #242424;
            border: 1px solid #2e2e2e82;
            border-radius: 10px;
            padding: 12px 14px;
            margin: 0 auto;
            width: 350px;
            max-width: 100%;
            max-height: 380px;
            color: #d5d5d5;
            font-family: 'Verdana', sans-serif;
            font-size: 12px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
            display: flex;
            flex-direction: column;
            overflow: hidden;
            box-sizing: border-box;
        `;

        const title = document.createElement('div');
        title.style.cssText = `
            font-weight: bold;
            font-size: 14px;
            border-bottom: 1px solid #3a3a3a;
            padding-bottom: 2px;
            margin-bottom: 3px;
            text-align: center;
            flex-shrink: 0;
        `;
        title.textContent = '📋 Расписание сборов (МСК)';

        const listContainer = document.createElement('div');
        listContainer.id = 'catwar-schedule-list-container';
        listContainer.style.cssText = `
            overflow-y: auto;
            flex: 1;
            padding-right: 4px;
            min-height: 0;
        `;

        const styleScrollbar = document.createElement('style');
        styleScrollbar.textContent = `
            #catwar-schedule-list-container::-webkit-scrollbar {
                width: 4px;
            }
            #catwar-schedule-list-container::-webkit-scrollbar-track {
                background: #1a1a1a;
                border-radius: 2px;
            }
            #catwar-schedule-list-container::-webkit-scrollbar-thumb {
                background: #3a3a3a;
                border-radius: 2px;
            }
            #catwar-schedule-list-container::-webkit-scrollbar-thumb:hover {
                background: #4a4a4a;
            }
            #catwar-schedule-list-container {
                scrollbar-width: thin;
                scrollbar-color: #3a3a3a #1a1a1a;
            }
        `;
        document.head.appendChild(styleScrollbar);

        const list = document.createElement('ul');
        list.style.cssText = `
            list-style: none;
            margin: 0;
            padding: 0;
        `;

        SCHEDULE_DATA.forEach(([mskTime, event]) => {
            const li = document.createElement('li');
            li.style.cssText = `
                padding: 3px 0;
                border-bottom: 1px dashed #2e2e2e;
                display: flex;
                justify-content: space-between;
                align-items: center;
                gap: 8px;
            `;
            const timeSpan = document.createElement('span');
            timeSpan.style.cssText = `
                font-weight: 600;
                color: #fc872a;
                white-space: nowrap;
                font-size: 11px;
            `;
            timeSpan.textContent = mskTime;
            const eventSpan = document.createElement('span');
            eventSpan.style.cssText = `
                word-break: break-word;
                text-align: right;
                color: #d5d5d5;
                font-size: 11px;
            `;
            eventSpan.textContent = event;
            li.appendChild(timeSpan);
            li.appendChild(eventSpan);
            list.appendChild(li);
        });

        countdownLi = document.createElement('li');
        countdownLi.id = 'catwar-countdown';
        countdownLi.style.cssText = `
            padding: 3px 0;
            border-bottom: 1px dashed #2e2e2e;
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 8px;
            background: #1a1a1a;
            border-radius: 4px;
            margin-top: 2px;
            padding: 4px 8px;
        `;
        countdownText = document.createElement('span');
        countdownText.style.cssText = `
            color: #fc872a;
            font-size: 11px;
            text-align: center;
            width: 100%;
        `;
        countdownText.textContent = 'Загрузка...';
        countdownLi.appendChild(countdownText);
        list.appendChild(countdownLi);

        listContainer.appendChild(list);
        block.appendChild(title);
        block.appendChild(listContainer);

        newTd.appendChild(block);
        newTr.appendChild(newTd);

        tbody.insertBefore(newTr, trMouth.nextSibling);

        if (window.countdownInterval) clearInterval(window.countdownInterval);

        function updateCountdown() {
            const nextEvent = findNextEvent();
            const diff = getTimeDiff(nextEvent.date);

            if (diff.total <= 0 && diff.total > -300000) {
                countdownText.innerHTML = `<strong>${nextEvent.event}</strong> сейчас! 🎯`;
                countdownText.style.color = '#4caf50';
                countdownLi.style.background = '#1a3a1a';
            } else if (diff.total <= 0) {
                updateCountdown();
                return;
            } else {
                const { hours, minutes, seconds } = diff;
                let timeStr = '';
                if (hours > 0) timeStr += `${hours}ч `;
                if (minutes > 0 || hours > 0) timeStr += `${minutes}м `;
                timeStr += `${seconds}с`;

                countdownText.innerHTML = `До <strong>${nextEvent.event}</strong> осталось <strong>${timeStr}</strong>`;
                countdownText.style.color = '#fc872a';
                countdownLi.style.background = '#1a1a1a';
            }
        }

        updateCountdown();
        window.countdownInterval = setInterval(updateCountdown, 1000);

        return true;
    }

    function init() {
        const created = createScheduleBlock();
        if (!created) {
            setTimeout(init, 500);
            return;
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    const observer = new MutationObserver(function() {
        const block = document.getElementById('catwar-schedule');
        if (!block && document.getElementById('tr_mouth')) {
            createScheduleBlock();
        }
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    window.addEventListener('beforeunload', function() {
        if (window.countdownInterval) clearInterval(window.countdownInterval);
        observer.disconnect();
    });

})();

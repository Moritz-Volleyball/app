// Volleyball rules & referee hand signals (FIVB indoor, simplified) – en / ru / de
(function () {
  'use strict';
  const rules = {
    en: [
      ['👥', 'Teams', '6 players per team on court. Substitutions: max. 6 per set; a starting player may leave and return once, only in their original position.'],
      ['🏁', 'Scoring', 'Rally point system: every rally scores a point. A set is won at 25 points with a 2-point lead (no cap). Deciding set to 15. Matches are best of 5 (often best of 3 in recreational play).'],
      ['🔄', 'Rotation', 'When your team wins the serve back, rotate one position clockwise. At the moment of the serve every player must be in correct rotational order (front/back and left/right relative to neighbours).'],
      ['🎯', 'Serve', 'Serve from behind the end line within 8 seconds after the whistle. Only one toss/release per attempt. A served ball touching the net and landing in is legal.'],
      ['✋', 'Contacts', 'Max. 3 contacts per team before the ball goes over (the block does not count). A player may not touch the ball twice in a row – except after a block or during the team’s first contact if it is one action.'],
      ['🧱', 'Block', 'Only front-row players may block. Blocking the opponent’s serve is not allowed. Reaching over the net is allowed when blocking, as long as you don’t interfere before the opponent attacks.'],
      ['🕸️', 'Net & centre line', 'Touching the net between the antennae while playing the ball is a fault. Crossing the centre line with the foot is allowed as long as part of the foot stays on or above the line and you don’t interfere.'],
      ['📏', 'In / out', 'A ball touching any part of the boundary line is IN. A ball touching the antennae, the posts or anything outside the court is OUT.'],
      ['🛡️', 'Back-row attack', 'Back-row players may only attack above net height if they take off behind the 3-metre line.'],
      ['🟡', 'Libero', 'Defensive specialist in a different shirt colour. Plays only in the back row, may not attack above net height, block or attempt to block. Libero replacements do not count as substitutions.'],
      ['⏱️', 'Time-outs', 'Each team may request 2 time-outs of 30 seconds per set.'],
      ['ℹ️', 'Recreational play', 'Many groups play simplified rules (e.g. no libero, free substitutions, sets to 21). Agree on house rules before the game.']
    ],
    ru: [
      ['👥', 'Команды', 'На площадке по 6 игроков. Замены: не более 6 за партию; игрок стартового состава может выйти и вернуться один раз, только на свою позицию.'],
      ['🏁', 'Счёт', 'Каждый розыгрыш приносит очко. Партия до 25 очков с разницей минимум 2 (без ограничения). Решающая партия до 15. Матч из 5 партий до 3 побед (в любительской игре часто до 2 побед).'],
      ['🔄', 'Переход', 'Когда команда возвращает себе подачу, игроки переходят на одну позицию по часовой стрелке. В момент подачи все должны стоять в правильном порядке расстановки.'],
      ['🎯', 'Подача', 'Подача из-за лицевой линии в течение 8 секунд после свистка. Мяч можно подбросить только один раз. Подача, задевшая сетку и попавшая в площадку, засчитывается.'],
      ['✋', 'Касания', 'Не более 3 касаний команды до перевода мяча (блок не считается). Игрок не может касаться мяча два раза подряд – кроме блока и первого касания команды одним действием.'],
      ['🧱', 'Блок', 'Блокировать могут только игроки передней линии. Блокировать подачу соперника запрещено. Переносить руки над сеткой на блоке можно, если не мешать сопернику до его атаки.'],
      ['🕸️', 'Сетка и средняя линия', 'Касание сетки между антеннами при игре мячом – ошибка. Заступ за среднюю линию стопой допустим, если часть стопы остаётся на линии или над ней и не мешает сопернику.'],
      ['📏', 'Мяч в поле / за', 'Мяч, коснувшийся любой части линии, – В ПОЛЕ. Мяч, коснувшийся антенны, стоек или чего-либо вне площадки, – ЗА.'],
      ['🛡️', 'Атака с задней линии', 'Игроки задней линии могут атаковать выше верхнего края сетки, только оттолкнувшись из-за 3-метровой линии.'],
      ['🟡', 'Либеро', 'Игрок защиты в форме другого цвета. Играет только в задней линии, не может атаковать выше сетки, блокировать или пытаться блокировать. Замены либеро не считаются заменами.'],
      ['⏱️', 'Тайм-ауты', 'Каждая команда может взять 2 тайм-аута по 30 секунд за партию.'],
      ['ℹ️', 'Любительская игра', 'Многие группы играют по упрощённым правилам (например, без либеро, свободные замены, партии до 21). Договоритесь о правилах заранее.']
    ],
    de: [
      ['👥', 'Mannschaften', '6 Spieler pro Team auf dem Feld. Wechsel: max. 6 pro Satz; ein Startspieler darf einmal raus und wieder rein, nur auf seine ursprüngliche Position.'],
      ['🏁', 'Zählweise', 'Jeder Ballwechsel zählt einen Punkt (Rally-Point). Ein Satz ist mit 25 Punkten und 2 Punkten Vorsprung gewonnen (ohne Obergrenze). Entscheidungssatz bis 15. Gespielt wird auf 3 Gewinnsätze (in Freizeitgruppen oft auf 2).'],
      ['🔄', 'Rotation', 'Holt sich das Team den Aufschlag zurück, rotieren alle eine Position im Uhrzeigersinn. Beim Aufschlag muss jeder in der richtigen Rotationsreihenfolge stehen.'],
      ['🎯', 'Aufschlag', 'Aufschlag hinter der Grundlinie innerhalb von 8 Sekunden nach dem Pfiff. Nur ein Hochwerfen pro Versuch. Ein Aufschlag, der die Netzkante berührt und im Feld landet, zählt.'],
      ['✋', 'Ballberührungen', 'Max. 3 Berührungen pro Team, bevor der Ball rübergeht (der Block zählt nicht). Niemand darf den Ball zweimal hintereinander spielen – außer nach einem Block oder bei der ersten Teamberührung in einer Aktion.'],
      ['🧱', 'Block', 'Nur Spieler der vorderen Reihe dürfen blocken. Den gegnerischen Aufschlag zu blocken ist verboten. Über das Netz greifen ist beim Block erlaubt, solange man den Gegner nicht vor seinem Angriff stört.'],
      ['🕸️', 'Netz & Mittellinie', 'Das Netz zwischen den Antennen beim Spielen des Balls zu berühren ist ein Fehler. Über die Mittellinie treten ist erlaubt, solange ein Teil des Fußes auf oder über der Linie bleibt und man nicht stört.'],
      ['📏', 'Aus / In', 'Ein Ball, der irgendeinen Teil der Linie berührt, ist IN. Berührt er die Antenne, die Pfosten oder etwas außerhalb des Feldes, ist er AUS.'],
      ['🛡️', 'Angriff aus dem Hinterfeld', 'Hinterspieler dürfen nur oberhalb der Netzkante angreifen, wenn sie hinter der 3-Meter-Linie abspringen.'],
      ['🟡', 'Libero', 'Abwehrspezialist im andersfarbigen Trikot. Spielt nur hinten, darf nicht über Netzhöhe angreifen, nicht blocken und keinen Blockversuch machen. Libero-Wechsel zählen nicht als Wechsel.'],
      ['⏱️', 'Auszeiten', 'Jedes Team darf pro Satz 2 Auszeiten zu je 30 Sekunden nehmen.'],
      ['ℹ️', 'Freizeitspiel', 'Viele Gruppen spielen vereinfacht (z. B. ohne Libero, freie Wechsel, Sätze bis 21). Hausregeln am besten vor dem Spiel absprechen.']
    ]
  };
  // [icon, name, how the referee shows it]
  const signals = {
    en: [
      ['👉', 'Authorisation to serve', 'Moves the hand to indicate the direction of the serve.'],
      ['🫲', 'Team to serve', 'Extends the arm towards the side of the team that will serve.'],
      ['🔁', 'Change of courts', 'Raises the forearms front and back and twists them around the body.'],
      ['⏸️', 'Time-out', 'Places the palm of one hand over the fingers of the other (a “T”), then points to the requesting team.'],
      ['🔄', 'Substitution', 'Circular motion of the forearms around each other.'],
      ['🟨', 'Warning / penalty', 'Shows a yellow card (warning) or red card (penalty).'],
      ['❌', 'End of set or match', 'Crosses the forearms in front of the chest, hands open.'],
      ['🤲', 'Ball not tossed at serve', 'Lifts the extended arm, palm up.'],
      ['8️⃣', 'Delay in serving', 'Raises eight fingers, spread open.'],
      ['🙌', 'Blocking fault / screening', 'Raises both arms vertically, palms forward.'],
      ['☝️', 'Position / rotation fault', 'Makes a circular motion with the forefinger.'],
      ['👇', 'Ball IN', 'Points arm and fingers towards the floor.'],
      ['🙆', 'Ball OUT', 'Raises the forearms vertically, hands open, palms towards the body.'],
      ['🖐️', 'Catch (held ball)', 'Slowly lifts the forearm, palm up.'],
      ['✌️', 'Double contact', 'Raises two fingers, spread open.'],
      ['4️⃣', 'Four hits', 'Raises four fingers, spread open.'],
      ['🕸️', 'Net fault', 'Indicates the relevant side of the net with the hand.'],
      ['🫳', 'Reaching beyond the net', 'Places a hand above the net, palm facing down.'],
      ['⬇️', 'Attack hit fault', 'Makes a downward motion with the forearm, hand open.'],
      ['↔️', 'Penetration / centre line', 'Points to the centre line.'],
      ['👍', 'Double fault – replay', 'Raises both thumbs vertically.'],
      ['🤚', 'Ball touched (touch-out)', 'Brushes the fingers of one vertically held hand with the palm of the other.']
    ],
    ru: [
      ['👉', 'Разрешение на подачу', 'Движением руки показывает направление подачи.'],
      ['🫲', 'Подающая команда', 'Вытягивает руку в сторону команды, которая будет подавать.'],
      ['🔁', 'Смена сторон', 'Поднимает предплечья спереди и сзади и поворачивает их вокруг корпуса.'],
      ['⏸️', 'Тайм-аут', 'Кладёт ладонь одной руки на пальцы другой (буква «Т»), затем указывает на команду.'],
      ['🔄', 'Замена', 'Вращает предплечья одно вокруг другого.'],
      ['🟨', 'Предупреждение / наказание', 'Показывает жёлтую (предупреждение) или красную (наказание) карточку.'],
      ['❌', 'Конец партии или матча', 'Скрещивает предплечья перед грудью, ладони открыты.'],
      ['🤲', 'Мяч не подброшен при подаче', 'Поднимает вытянутую руку ладонью вверх.'],
      ['8️⃣', 'Задержка подачи', 'Показывает восемь раскрытых пальцев.'],
      ['🙌', 'Ошибка блока / заслон', 'Поднимает обе руки вертикально, ладонями вперёд.'],
      ['☝️', 'Ошибка расстановки / перехода', 'Делает круговое движение указательным пальцем.'],
      ['👇', 'Мяч В ПОЛЕ', 'Указывает рукой и пальцами в пол.'],
      ['🙆', 'Мяч ЗА', 'Поднимает предплечья вертикально, ладони открыты и обращены к себе.'],
      ['🖐️', 'Задержка мяча (захват)', 'Медленно поднимает предплечье ладонью вверх.'],
      ['✌️', 'Двойное касание', 'Показывает два раскрытых пальца.'],
      ['4️⃣', 'Четыре касания', 'Показывает четыре раскрытых пальца.'],
      ['🕸️', 'Касание сетки', 'Указывает рукой на соответствующую сторону сетки.'],
      ['🫳', 'Перенос рук над сеткой', 'Держит руку над сеткой ладонью вниз.'],
      ['⬇️', 'Ошибка при атаке', 'Делает движение предплечьем вниз, ладонь открыта.'],
      ['↔️', 'Заступ / средняя линия', 'Указывает на среднюю линию.'],
      ['👍', 'Обоюдная ошибка – переигровка', 'Поднимает оба больших пальца вертикально.'],
      ['🤚', 'Мяч задет (касание)', 'Проводит ладонью одной руки по пальцам другой, поднятой вертикально.']
    ],
    de: [
      ['👉', 'Aufschlagfreigabe', 'Zeigt mit der Hand die Richtung des Aufschlags an.'],
      ['🫲', 'Aufschlagendes Team', 'Streckt den Arm zur Seite des Teams, das aufschlägt.'],
      ['🔁', 'Seitenwechsel', 'Hebt die Unterarme vor und hinter dem Körper und dreht sie um den Körper.'],
      ['⏸️', 'Auszeit', 'Legt die Handfläche auf die Finger der anderen, senkrecht gehaltenen Hand („T“) und zeigt dann auf das Team.'],
      ['🔄', 'Spielerwechsel', 'Kreisende Bewegung der Unterarme umeinander.'],
      ['🟨', 'Verwarnung / Strafe', 'Zeigt die gelbe (Verwarnung) oder rote Karte (Strafe).'],
      ['❌', 'Satz- oder Spielende', 'Kreuzt die Unterarme vor der Brust, Hände offen.'],
      ['🤲', 'Ball beim Aufschlag nicht hochgeworfen', 'Hebt den gestreckten Arm, Handfläche nach oben.'],
      ['8️⃣', 'Aufschlagverzögerung', 'Zeigt acht gespreizte Finger.'],
      ['🙌', 'Blockfehler / Sichtblock', 'Hebt beide Arme senkrecht, Handflächen nach vorn.'],
      ['☝️', 'Positions- / Rotationsfehler', 'Macht eine kreisende Bewegung mit dem Zeigefinger.'],
      ['👇', 'Ball IN', 'Zeigt mit Arm und Fingern auf den Boden.'],
      ['🙆', 'Ball AUS', 'Hebt die Unterarme senkrecht, Hände offen, Handflächen zum Körper.'],
      ['🖐️', 'Gehaltener Ball', 'Hebt langsam den Unterarm, Handfläche nach oben.'],
      ['✌️', 'Doppelberührung', 'Zeigt zwei gespreizte Finger.'],
      ['4️⃣', 'Vier Berührungen', 'Zeigt vier gespreizte Finger.'],
      ['🕸️', 'Netzberührung', 'Zeigt mit der Hand auf die betreffende Netzseite.'],
      ['🫳', 'Übergreifen', 'Hält eine Hand über das Netz, Handfläche nach unten.'],
      ['⬇️', 'Angriffsfehler', 'Macht mit dem Unterarm eine Bewegung nach unten, Hand offen.'],
      ['↔️', 'Übertreten / Mittellinie', 'Zeigt auf die Mittellinie.'],
      ['👍', 'Doppelfehler – Wiederholung', 'Hebt beide Daumen senkrecht.'],
      ['🤚', 'Ball berührt (abgewehrt)', 'Streift mit der Handfläche über die Finger der anderen, senkrecht gehaltenen Hand.']
    ]
  };
  self.CONTENT = { rules, signals };
})();

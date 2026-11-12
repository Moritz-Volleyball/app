// 5-1 rotation quiz – scenarios, court positions (metres) and texts in en / ru / de
// Court: x 0–9 m from left to right sideline (seen from behind our end line), y 0 = net, 9 = our end line.
// Players: S = setter (the only fixed role), a–e = teammates without a fixed role (shown with jersey numbers).
(function () {
  'use strict';
  const T = [6.2, 1.0]; // setter target ("base"): right of centre, about 1 m from the net
  const jersey = { a: 7, b: 11, c: 4, d: 9, e: 14 };
  const F_OK = { S: [8.2, 2.0], e: [7.8, 1.2], a: [4.5, 3.4], b: [1.5, 3.6], c: [1.6, 7.0], d: [4.6, 7.2] };
  const F_PASS = { S: [7.4, 6.8], e: [7.8, 1.2], a: [4.5, 3.4], b: [1.5, 3.6], c: [1.6, 7.0], d: [4.6, 7.2] };
  const F_OVL = { S: [8.2, 2.0], e: [7.8, 1.2], a: [4.5, 7.6], b: [1.5, 3.6], c: [1.6, 7.0], d: [4.6, 5.4] };
  const F_FRONT = { S: [7.6, 0.6], e: [7.8, 2.6], a: [4.5, 3.4], b: [1.5, 3.6], c: [1.6, 7.0], d: [4.6, 7.2] };
  const STD = { p1: [7.5, 7.0], p2: [7.5, 2.0], p3: [4.5, 2.0], p4: [1.5, 2.0], p5: [1.5, 7.0], p6: [4.5, 7.0] };

  const Q = [
    { // 1 – position numbers
      id: 'num', kind: 'text', correct: 0,
      pl: { S: STD.p2, a: STD.p3, b: STD.p4, c: STD.p5, d: STD.p6, e: STD.p1 }, hl: ['e'],
      sol: [{ nums: true }],
      t: {
        en: { q: 'Which position is the highlighted player (#14) standing in?', o: ['Position 1', 'Position 6', 'Position 2', 'Position 5'], x: 'Positions are numbered anti-clockwise, starting at the back right: 1 = right back (the server), 2 = right front, 3 = middle front, 4 = left front, 5 = left back, 6 = middle back.' },
        ru: { q: 'В какой зоне стоит выделенный игрок (№14)?', o: ['Зона 1', 'Зона 6', 'Зона 2', 'Зона 5'], x: 'Зоны нумеруются против часовой стрелки, начиная сзади справа: 1 – задняя правая (подающий), 2 – передняя правая, 3 – передняя центральная, 4 – передняя левая, 5 – задняя левая, 6 – задняя центральная.' },
        de: { q: 'Auf welcher Position steht der markierte Spieler (#14)?', o: ['Position 1', 'Position 6', 'Position 2', 'Position 5'], x: 'Die Positionen sind gegen den Uhrzeigersinn nummeriert, hinten rechts beginnend: 1 = hinten rechts (Aufschläger), 2 = vorne rechts, 3 = vorne Mitte, 4 = vorne links, 5 = hinten links, 6 = hinten Mitte.' }
      }
    },
    { // 2 – rotation / who serves
      id: 'rot', kind: 'player', opts: ['S', 'e', 'd', 'a'], correct: 0,
      pl: { S: STD.p2, a: STD.p3, b: STD.p4, c: STD.p5, d: STD.p6, e: STD.p1 },
      sol: [{ moves: { S: [7.5, 9.8], a: STD.p2, b: STD.p3, c: STD.p4, d: STD.p5, e: STD.p6 }, ball: [[7.5, 9.4], [7.5, 9.4]] }],
      t: {
        en: { q: 'The opponent served and we won the rally. Who serves next?', o: ['The setter (position 2)', '#14 (position 1)', '#9 (position 6)', '#7 (position 3)'], x: 'When we win the serve back, everybody rotates one position clockwise: 2 → 1, 1 → 6, 6 → 5, 5 → 4, 4 → 3, 3 → 2. The player coming from position 2 serves – here that is our setter.' },
        ru: { q: 'Подавал соперник, розыгрыш выиграли мы. Кто подаёт следующим?', o: ['Связующий (зона 2)', '№14 (зона 1)', '№9 (зона 6)', '№7 (зона 3)'], x: 'Когда мы отыгрываем подачу, все переходят на одну зону по часовой стрелке: 2 → 1, 1 → 6, 6 → 5, 5 → 4, 4 → 3, 3 → 2. Подаёт игрок, пришедший из зоны 2, – здесь это наш связующий.' },
        de: { q: 'Der Gegner hat aufgeschlagen und wir haben den Ballwechsel gewonnen. Wer schlägt jetzt auf?', o: ['Der Zuspieler (Position 2)', '#14 (Position 1)', '#9 (Position 6)', '#7 (Position 3)'], x: 'Holen wir uns den Aufschlag zurück, rotieren alle eine Position im Uhrzeigersinn: 2 → 1, 1 → 6, 6 → 5, 5 → 4, 4 → 3, 3 → 2. Aufschlagen darf der Spieler, der von Position 2 kommt – hier unser Zuspieler.' }
      }
    },
    { // 3 – setter target
      id: 'target', kind: 'spot', correct: 1,
      spots: [[4.5, 0.7], [6.2, 1.0], [8.6, 0.7], [4.5, 3.3]],
      pl: { S: [7.6, 1.8], a: [4.5, 1.8], b: [1.5, 2.6], c: [1.9, 6.6], d: [4.5, 7.0], e: [7.4, 6.6] }, ball0: [2.1, 6.1],
      sol: [{ moves: { S: T }, ball: [[2.1, 6.1], [6.2, 0.7]], h: 3.5 }, { moves: { b: [1.2, 1.0] }, ball: [[6.2, 0.7], [1.2, 0.6]], h: 3 }],
      t: {
        en: { q: '#4 passes the ball. Where is the setter’s target spot – the place every pass should go to?', o: ['A – exactly in the middle at the net', 'B – right of the middle, about 1 m from the net', 'C – at the right sideline at the net', 'D – middle, at the 3 m line'], x: 'The target is right of centre (between position 2 and 3), about one metre off the net. From there the setter can reach the front left with a front set and the right side with a back set, and bad passes rarely fly straight over the net.' },
        ru: { q: '№4 принимает мяч. Где «точка» связующего – место, куда должен идти каждый приём?', o: ['A – ровно в центре у сетки', 'B – правее центра, примерно в 1 м от сетки', 'C – у правой боковой линии у сетки', 'D – в центре на линии 3 м'], x: 'Точка находится правее центра (между зонами 2 и 3), примерно в метре от сетки. Отсюда связующий достаёт передачей вперёд до зоны 4 и передачей назад до зоны 2, а неточный приём реже улетает прямо за сетку.' },
        de: { q: '#4 nimmt den Ball an. Wo ist der Zielpunkt des Zuspielers – die Stelle, zu der jede Annahme soll?', o: ['A – genau in der Mitte am Netz', 'B – rechts von der Mitte, ca. 1 m vom Netz', 'C – an der rechten Seitenlinie am Netz', 'D – Mitte, an der 3-m-Linie'], x: 'Der Zielpunkt liegt rechts der Mitte (zwischen Position 2 und 3), etwa einen Meter vom Netz. Von dort erreicht der Zuspieler mit einem Pass nach vorne links und mit einem Rückwärtspass rechts – und missglückte Annahmen fliegen seltener direkt übers Netz.' }
      }
    },
    { // 4 – setter in position 1, serve receive
      id: 'hide1', kind: 'spot', correct: 1,
      spots: [[7.8, 0.45], [8.3, 2.1], [3.6, 7.8], [8.0, 8.6]],
      pl: { S: [9.9, 9.6], a: [4.5, 3.2], b: [1.5, 3.4], c: [1.6, 7.0], d: [4.6, 7.2], e: [7.8, 1.2] }, ghost: ['S'], slots: { S: 1, e: 2, a: 3, b: 4, c: 5, d: 6 },
      sol: [{ moves: { S: [8.3, 2.1] } }, { label: 'afterServe', moves: { S: T } }],
      t: {
        en: { q: 'The opponent serves. Our setter is in position 1 (back right). What is the best spot for the setter before the serve?', o: ['A – at the net, in front of #14', 'B – directly behind #14, right of #9', 'C – left of #9', 'D – deep in the right back corner'], x: 'Until the serve is hit, the setter (position 1) only has to be behind position 2 (#14) and to the right of position 6 (#9). So the setter “hides” directly behind #14, does not pass, and sprints to the target the moment the serve is hit. A is a positional fault (in front of 2), C is one too (left of 6), D is legal but much too far away.' },
        ru: { q: 'Подаёт соперник. Наш связующий в зоне 1 (сзади справа). Где ему лучше всего стоять до подачи?', o: ['A – у сетки перед №14', 'B – сразу за №14, правее №9', 'C – левее №9', 'D – глубоко в правом заднем углу'], x: 'До удара по мячу при подаче связующий (зона 1) должен быть только позади игрока зоны 2 (№14) и правее игрока зоны 6 (№9). Поэтому он «прячется» прямо за №14, не принимает и в момент подачи бежит на точку. A – ошибка расстановки (впереди зоны 2), C – тоже (левее зоны 6), D разрешено, но слишком далеко.' },
        de: { q: 'Der Gegner schlägt auf. Unser Zuspieler steht auf Position 1 (hinten rechts). Wo steht er vor dem Aufschlag am besten?', o: ['A – am Netz vor #14', 'B – direkt hinter #14, rechts von #9', 'C – links von #9', 'D – tief in der hinteren rechten Ecke'], x: 'Bis der Aufschlag geschlagen ist, muss der Zuspieler (Position 1) nur hinter Position 2 (#14) und rechts von Position 6 (#9) stehen. Er „versteckt“ sich also direkt hinter #14, nimmt nicht an und sprintet beim Aufschlag zum Zielpunkt. A ist ein Aufstellungsfehler (vor Position 2), C ebenso (links von Position 6), D ist erlaubt, aber viel zu weit weg.' }
      }
    },
    { // 5 – receive formation
      id: 'form1', kind: 'formation', correct: 1, forms: [F_OVL, F_OK, F_PASS, F_FRONT],
      pl: { S: STD.p1, e: STD.p2, a: STD.p3, b: STD.p4, c: STD.p5, d: STD.p6 }, slots: { S: 1, e: 2, a: 3, b: 4, c: 5, d: 6 },
      sol: [{ moves: F_OK }, { label: 'afterServe', moves: { S: T, e: [7.6, 2.4] } }],
      t: {
        en: { q: 'Setter in position 1, the opponent serves. Which receive formation is correct?', o: ['A', 'B', 'C', 'D'], x: 'B: four players pass in a “W/U” shape, #14 stays at the net and the setter hides directly behind #14 – legal and the setter never has to pass. A: #7 (pos. 3) stands behind #9 (pos. 6) → positional fault. C: the setter is in the passing line and would have to pass the serve. D: the setter (back row) is in front of #14 (pos. 2) → positional fault.' },
        ru: { q: 'Связующий в зоне 1, подаёт соперник. Какая расстановка на приёме правильная?', o: ['A', 'B', 'C', 'D'], x: 'B: четверо принимают «полукругом/W», №14 остаётся у сетки, а связующий прячется прямо за ним – это разрешено, и связующему не нужно принимать. A: №7 (зона 3) стоит позади №9 (зона 6) → ошибка расстановки. C: связующий стоит в линии приёма и должен был бы принимать подачу. D: связующий (задняя линия) впереди №14 (зона 2) → ошибка расстановки.' },
        de: { q: 'Zuspieler auf Position 1, der Gegner schlägt auf. Welche Annahme-Aufstellung ist richtig?', o: ['A', 'B', 'C', 'D'], x: 'B: Vier Spieler nehmen im „W/U“ an, #14 bleibt am Netz und der Zuspieler versteckt sich direkt hinter #14 – regelkonform, und er muss nie annehmen. A: #7 (Pos. 3) steht hinter #9 (Pos. 6) → Aufstellungsfehler. C: Der Zuspieler steht in der Annahmereihe und müsste annehmen. D: Der Zuspieler (Hinterfeld) steht vor #14 (Pos. 2) → Aufstellungsfehler.' }
      }
    },
    { // 6 – setter in position 4, serve receive
      id: 'hide4', kind: 'spot', correct: 0,
      spots: [[1.0, 0.8], [5.8, 0.8], [1.6, 7.7], [2.7, 4.7]],
      pl: { S: [-1.0, 4.6], a: [4.6, 1.2], e: [7.6, 3.4], c: [1.6, 6.4], d: [4.6, 6.9], b: [7.5, 7.0] }, ghost: ['S'], slots: { S: 4, a: 3, e: 2, b: 1, c: 5, d: 6 },
      sol: [{ moves: { S: [1.0, 0.8] } }, { label: 'afterServe', moves: { S: T, a: [3.8, 2.6] } }],
      t: {
        en: { q: 'The setter is in position 4 (front left) and the opponent serves. Where does the setter wait?', o: ['A – at the net, left of #7', 'B – at the net, right of #7', 'C – behind #4', 'D – in the passing line'], x: 'In position 4 the setter must stay left of position 3 (#7) and in front of position 5 (#4). So the setter waits close to the net on the left and runs along the net to the target when the serve is hit. B is a positional fault (right of 3), C too (behind 5), and in D the setter would have to pass.' },
        ru: { q: 'Связующий в зоне 4 (впереди слева), подаёт соперник. Где он ждёт?', o: ['A – у сетки левее №7', 'B – у сетки правее №7', 'C – позади №4', 'D – в линии приёма'], x: 'В зоне 4 связующий должен быть левее игрока зоны 3 (№7) и впереди игрока зоны 5 (№4). Поэтому он ждёт слева у самой сетки и после удара по мячу бежит вдоль сетки на точку. B – ошибка расстановки (правее зоны 3), C – тоже (позади зоны 5), а в D ему пришлось бы принимать.' },
        de: { q: 'Der Zuspieler steht auf Position 4 (vorne links), der Gegner schlägt auf. Wo wartet er?', o: ['A – am Netz, links von #7', 'B – am Netz, rechts von #7', 'C – hinter #4', 'D – in der Annahmereihe'], x: 'Auf Position 4 muss der Zuspieler links von Position 3 (#7) und vor Position 5 (#4) stehen. Er wartet also links nah am Netz und läuft beim Aufschlag am Netz entlang zum Zielpunkt. B ist ein Aufstellungsfehler (rechts von 3), C ebenso (hinter 5), und bei D müsste er annehmen.' }
      }
    },
    { // 7 – setter in position 6
      id: 'hide6', kind: 'spot', correct: 0,
      spots: [[4.6, 1.9], [4.6, 0.45], [8.4, 2.4], [4.5, 7.7]],
      pl: { S: [4.5, 10.0], b: [1.5, 4.0], a: [4.5, 1.0], e: [7.5, 4.0], c: [1.5, 7.2], d: [7.5, 7.2] }, ghost: ['S'], slots: { S: 6, a: 3, b: 4, e: 2, c: 5, d: 1 },
      sol: [{ moves: { S: [4.6, 1.9] } }, { label: 'afterServe', moves: { S: T } }],
      t: {
        en: { q: 'The setter is in position 6 (middle back). #7 stands at the net in position 3. Where should the setter stand before the serve?', o: ['A – directly behind #7', 'B – in front of #7 at the net', 'C – right of #9 (position 1)', 'D – deep in the middle'], x: 'Position 6 only has to be behind position 3 and between positions 5 and 1. If #7 stays at the net, the setter can stand right behind #7 and is only a few steps away from the target. B is a positional fault (in front of 3), C too (right of position 1), D is legal but far away and in the passing zone.' },
        ru: { q: 'Связующий в зоне 6 (сзади в центре). №7 стоит у сетки в зоне 3. Где связующему стоять до подачи?', o: ['A – прямо за №7', 'B – перед №7 у сетки', 'C – правее №9 (зона 1)', 'D – глубоко в центре'], x: 'Игрок зоны 6 должен быть только позади зоны 3 и между зонами 5 и 1. Если №7 остаётся у сетки, связующий может стоять прямо за ним – до точки всего пара шагов. B – ошибка расстановки (впереди зоны 3), C – тоже (правее зоны 1), D разрешено, но далеко и в зоне приёма.' },
        de: { q: 'Der Zuspieler steht auf Position 6 (hinten Mitte). #7 steht auf Position 3 am Netz. Wo sollte der Zuspieler vor dem Aufschlag stehen?', o: ['A – direkt hinter #7', 'B – vor #7 am Netz', 'C – rechts von #9 (Position 1)', 'D – tief in der Mitte'], x: 'Position 6 muss nur hinter Position 3 und zwischen Position 5 und 1 stehen. Bleibt #7 am Netz, kann der Zuspieler direkt hinter #7 stehen und hat nur ein paar Schritte zum Zielpunkt. B ist ein Aufstellungsfehler (vor 3), C ebenso (rechts von Position 1), D ist erlaubt, aber weit weg und mitten in der Annahme.' }
      }
    },
    { // 8 – positional fault
      id: 'fault', kind: 'text', correct: 0,
      pl: { b: [1.5, 5.8], c: [1.8, 3.9], a: [4.5, 1.5], d: [4.5, 6.8], e: [7.6, 1.4], S: [8.1, 2.2] }, slots: { S: 1, e: 2, a: 3, b: 4, c: 5, d: 6 },
      sol: [{ bad: ['b', 'c'] }, { moves: { b: [1.5, 3.4], c: [1.7, 6.8] } }],
      t: {
        en: { q: 'The opponent is about to serve. Which pair is in a positional fault? (The small numbers show each player’s position.)', o: ['Positions 4 and 5', 'Positions 3 and 6', 'Positions 2 and 1 (setter)', 'No fault'], x: 'At the moment of the serve, each back-row player must be further from the net than the front-row player in front of them (1 behind 2, 6 behind 3, 5 behind 4), and left/right order must be kept in each row. Here position 5 (#4) is closer to the net than position 4 (#11) → fault. After the serve everyone may move freely.' },
        ru: { q: 'Соперник сейчас подаст. Какая пара нарушает расстановку? (Маленькие цифры – зоны игроков.)', o: ['Зоны 4 и 5', 'Зоны 3 и 6', 'Зоны 2 и 1 (связующий)', 'Ошибки нет'], x: 'В момент подачи каждый игрок задней линии должен быть дальше от сетки, чем соответствующий игрок передней линии (1 за 2, 6 за 3, 5 за 4), а в каждой линии сохраняется порядок слева направо. Здесь зона 5 (№4) ближе к сетке, чем зона 4 (№11) → ошибка. После подачи все могут перемещаться свободно.' },
        de: { q: 'Der Gegner schlägt gleich auf. Welches Paar macht einen Aufstellungsfehler? (Die kleinen Zahlen zeigen die Position.)', o: ['Positionen 4 und 5', 'Positionen 3 und 6', 'Positionen 2 und 1 (Zuspieler)', 'Kein Fehler'], x: 'Beim Aufschlag muss jeder Hinterspieler weiter vom Netz weg sein als der Vorderspieler vor ihm (1 hinter 2, 6 hinter 3, 5 hinter 4), und in jeder Reihe muss die Links-rechts-Reihenfolge stimmen. Hier steht Position 5 (#4) näher am Netz als Position 4 (#11) → Fehler. Nach dem Aufschlag darf sich jeder frei bewegen.' }
      }
    },
    { // 9 – switching after our serve
      id: 'switch', kind: 'spot', correct: 1,
      spots: [[4.5, 0.6], [7.2, 0.9], [1.4, 0.6], [4.5, 5.4]],
      pl: { b: [1.5, 1.3], S: [4.5, 1.3], e: [7.5, 1.3], c: [1.5, 6.8], d: [4.5, 6.8], a: [7.5, 9.8] }, ball0: [7.5, 9.4], slots: { S: 3, e: 2, b: 4, a: 1, c: 5, d: 6 },
      sol: [{ ball: [[7.5, 9.4], [3.0, -3.9]], h: 3, moves: { a: [7.4, 7.0] } }, { moves: { S: [7.2, 0.9], e: [4.6, 0.9] } }],
      t: {
        en: { q: 'We serve. The setter is in position 3 (middle front). Where does the setter go right after the serve is hit?', o: ['A – stays in the middle', 'B – switches to the right front', 'C – goes to the left front', 'D – drops back to the 3 m line'], x: 'After the serve contact everyone may leave their rotation spot. A front-row setter switches to the right front: there they block on the right and are closest to the target for the next set. #14 switches into the middle in exchange.' },
        ru: { q: 'Подаём мы. Связующий в зоне 3 (впереди в центре). Куда он идёт сразу после удара по мячу при подаче?', o: ['A – остаётся в центре', 'B – переходит вперёд направо', 'C – уходит вперёд налево', 'D – отходит на линию 3 м'], x: 'После удара по мячу при подаче все могут покинуть свои зоны. Связующий передней линии переходит направо: там он блокирует справа и ближе всех к точке для следующей передачи. №14 в обмен переходит в центр.' },
        de: { q: 'Wir schlagen auf. Der Zuspieler steht auf Position 3 (vorne Mitte). Wohin geht er direkt nach dem Aufschlag?', o: ['A – bleibt in der Mitte', 'B – wechselt nach vorne rechts', 'C – geht nach vorne links', 'D – geht zurück zur 3-m-Linie'], x: 'Nach dem Aufschlag darf jeder seine Rotationsposition verlassen. Ein Zuspieler im Vorderfeld wechselt nach vorne rechts: Dort blockt er rechts und ist am nächsten am Zielpunkt für das nächste Zuspiel. #14 wechselt dafür in die Mitte.' }
      }
    },
    { // 10 – defensive base of a back-row setter
      id: 'defense', kind: 'spot', correct: 0,
      spots: [[7.6, 7.0], [4.5, 8.2], [1.6, 6.8], [6.2, 1.2]],
      pl: { b: [1.5, 1.2], a: [4.5, 1.2], e: [7.5, 1.2], S: [1.6, 6.6], d: [4.5, 7.0], c: [7.5, 6.6] }, opp: [[7.6, -1.6]], ball0: [7.6, -1.9], slots: { S: 5, b: 4, a: 3, e: 2, c: 1, d: 6 },
      sol: [{ moves: { S: [7.6, 7.0], c: [1.6, 6.8], e: [7.6, 0.5], a: [6.6, 0.5] } }, { ball: [[7.6, -1.9], [2.0, 6.3]], h: 0.6 }, { moves: { S: T }, ball: [[2.0, 6.3], [6.2, 0.7]], h: 3.5 }],
      t: {
        en: { q: 'Rally: the opponent attacks. Our setter is in the back row (position 5). Which defensive spot should the setter take?', o: ['A – right back', 'B – middle back', 'C – stay left back', 'D – at the net at the target'], x: 'A back-row setter always defends right back (switch with #4). From there the way to the target is shortest, and the other players can dig the ball towards the setter. Running to the net (D) before the dig leaves a hole in the defence.' },
        ru: { q: 'Розыгрыш: соперник атакует. Наш связующий на задней линии (зона 5). Какое место в защите ему занять?', o: ['A – сзади справа', 'B – сзади в центре', 'C – остаться сзади слева', 'D – у сетки на точке'], x: 'Связующий задней линии всегда защищается сзади справа (меняется с №4). Оттуда путь до точки самый короткий, а остальные доводят мяч к нему. Если бежать к сетке (D) до приёма, в защите остаётся дыра.' },
        de: { q: 'Ballwechsel: Der Gegner greift an. Unser Zuspieler steht im Hinterfeld (Position 5). Welche Abwehrposition nimmt er ein?', o: ['A – hinten rechts', 'B – hinten Mitte', 'C – bleibt hinten links', 'D – am Netz am Zielpunkt'], x: 'Ein Zuspieler im Hinterfeld verteidigt immer hinten rechts (Wechsel mit #4). Von dort ist der Weg zum Zielpunkt am kürzesten, und die anderen spielen die Abwehr zu ihm. Läuft er vor der Abwehr ans Netz (D), entsteht ein Loch in der Verteidigung.' }
      }
    },
    { // 11 – setter plays the first ball
      id: 'help', kind: 'player', opts: ['e', 'd', 'c', 'S'], correct: 0,
      pl: { S: [7.4, 6.8], b: [1.6, 2.6], a: [4.5, 2.5], e: [7.4, 2.6], c: [1.6, 7.0], d: [4.5, 7.6] }, ball0: [7.4, 6.3],
      sol: [{ moves: { e: [6.2, 1.2] }, ball: [[7.4, 6.3], [6.2, 0.9]], h: 3.5 }, { moves: { b: [1.2, 1.0] }, ball: [[6.2, 0.9], [1.2, 0.6]], h: 3 }],
      t: {
        en: { q: 'The setter has to dig the first ball. Who sets the second ball?', o: ['#14 – right front', '#9 – middle back', '#4 – left back', 'The setter again'], x: 'If the setter plays the first contact, they call “Help!” and the front-row player closest to the target – usually right front – sets. The setter may not touch the ball twice in a row.' },
        ru: { q: 'Связующему пришлось принимать первый мяч. Кто делает вторую передачу?', o: ['№14 – впереди справа', '№9 – сзади в центре', '№4 – сзади слева', 'Снова связующий'], x: 'Если первое касание у связующего, он кричит «Помоги!» / «Help!», и передачу делает игрок передней линии, ближайший к точке, – обычно справа впереди. Два касания подряд связующему делать нельзя.' },
        de: { q: 'Der Zuspieler muss den ersten Ball spielen. Wer spielt den zweiten Ball zu?', o: ['#14 – vorne rechts', '#9 – hinten Mitte', '#4 – hinten links', 'Nochmal der Zuspieler'], x: 'Spielt der Zuspieler den ersten Ball, ruft er „Hilfe!“ – dann stellt der Vorderspieler, der am nächsten am Zielpunkt ist, meist vorne rechts. Zweimal hintereinander darf der Zuspieler den Ball nicht spielen.' }
      }
    },
    { // 12 – back-row setter at the net
      id: 'dump', kind: 'text', correct: 1,
      pl: { S: [6.0, 0.6], b: [1.5, 1.6], a: [4.5, 2.4], e: [7.6, 2.2], c: [1.6, 6.6], d: [4.5, 7.0] }, ball0: [6.0, 0.2], slots: { S: 1, e: 2, a: 3, b: 4, c: 5, d: 6 },
      sol: [{ ballX: [[6.0, 0.2], [5.2, -2.2]] }, { moves: { b: [1.2, 1.0] }, ball: [[6.0, 0.2], [1.2, 0.6]], h: 3 }],
      t: {
        en: { q: 'Our setter is in the back row (position 1) and gets a perfect pass that is completely above the net. May the setter “dump” it over the net (setter attack)?', o: ['Yes, the second touch can always go over', 'No – a back-row player may not send it over in the front zone while the ball is completely above the net', 'Yes, if the setter jumps', 'Only with one hand'], x: 'A back-row player may not complete an attack in the front zone (in front of the 3 m line) when the ball is completely higher than the top of the net. So a back-row setter sets to a front-row player instead. In the front row the setter may dump.' },
        ru: { q: 'Наш связующий на задней линии (зона 1) получает идеальный приём полностью выше сетки. Можно ли ему «скинуть» мяч через сетку (атака связующего)?', o: ['Да, второе касание всегда можно перевести', 'Нет – игрок задней линии в передней зоне не может переводить мяч, находящийся полностью выше сетки', 'Да, если связующий выпрыгивает', 'Только одной рукой'], x: 'Игрок задней линии не может завершать атаку в передней зоне (до линии 3 м), если мяч в момент удара полностью выше верхнего края сетки. Поэтому связующий задней линии отдаёт передачу игроку передней линии. В передней линии «скидка» разрешена.' },
        de: { q: 'Unser Zuspieler steht im Hinterfeld (Position 1) und bekommt eine perfekte Annahme komplett über Netzhöhe. Darf er den Ball übers Netz legen (Zuspielerfinte)?', o: ['Ja, der zweite Ball darf immer rüber', 'Nein – ein Hinterspieler darf im Vorderfeld keinen Ball rüberspielen, der komplett über Netzhöhe ist', 'Ja, wenn er dabei springt', 'Nur mit einer Hand'], x: 'Ein Hinterspieler darf im Vorderfeld (vor der 3-m-Linie) keinen Angriff abschließen, wenn der Ball beim Spielen vollständig höher als die Netzkante ist. Ein Zuspieler im Hinterfeld stellt deshalb zu einem Vorderspieler. Im Vorderfeld darf er legen.' }
      }
    },
    { // 13 – free ball
      id: 'free', kind: 'spot', correct: 1,
      spots: [[1.6, 7.4], [6.2, 1.0], [1.4, 0.8], [4.5, 4.5]],
      pl: { S: [1.6, 6.8], b: [1.5, 1.5], a: [4.5, 1.5], e: [7.5, 1.5], d: [4.5, 7.0], c: [7.5, 6.8] }, opp: [[4.5, -3.2]], ball0: [4.5, -3.5], slots: { S: 5, b: 4, a: 3, e: 2, d: 6, c: 1 },
      sol: [{ moves: { S: T, b: [1.5, 3.4], a: [4.5, 3.4], e: [7.6, 3.4] }, ball: [[4.5, -3.5], [4.5, 6.6]], h: 3 }, { ball: [[4.5, 6.6], [6.2, 0.7]], h: 3.5 }],
      t: {
        en: { q: 'The opponent can only send an easy “free ball”. Our setter is in position 5. What does the setter do?', o: ['A – stays left back and passes', 'B – runs straight to the target', 'C – goes to the left front at the net', 'D – waits in the middle of the court'], x: 'As soon as it is clear that a free ball is coming, the setter calls “Free!” and runs to the target right away – the others pass. The front-row players drop back to the 3 m line to get a run-up for the attack.' },
        ru: { q: 'Соперник может отправить только лёгкий «свободный мяч». Наш связующий в зоне 5. Что он делает?', o: ['A – остаётся сзади слева и принимает', 'B – сразу бежит на точку', 'C – идёт вперёд налево к сетке', 'D – ждёт в центре площадки'], x: 'Как только понятно, что летит свободный мяч, связующий кричит «Free!» / «Свободный!» и сразу бежит на точку – принимают другие. Игроки передней линии отходят к линии 3 м, чтобы взять разбег для атаки.' },
        de: { q: 'Der Gegner kann nur einen leichten „Freeball“ rüberspielen. Unser Zuspieler steht auf Position 5. Was macht er?', o: ['A – bleibt hinten links und nimmt an', 'B – läuft sofort zum Zielpunkt', 'C – geht nach vorne links ans Netz', 'D – wartet in der Feldmitte'], x: 'Sobald klar ist, dass ein Freeball kommt, ruft der Zuspieler „Free!“ und läuft sofort zum Zielpunkt – die anderen nehmen an. Die Vorderspieler gehen zur 3-m-Linie zurück, um Anlauf für den Angriff zu nehmen.' }
      }
    }
  ];
  self.QUIZ = { T, jersey, questions: Q };
})();

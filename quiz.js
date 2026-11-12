// 5-1 rotation quiz – scenarios, court positions (metres) and texts in en / ru / de
// Court: x 0–9 m from left to right sideline (seen from behind our end line), y 0 = net, 9 = our end line.
// Players: S = setter (the only fixed role), a–e = teammates without a fixed role (shown with jersey numbers).
(function () {
  'use strict';
  const T = [6.2, 1.0]; // setter target ("base"): right of centre, about 1 m from the net
  const jersey = { a: 7, b: 11, c: 4, d: 9, e: 14 };
  const F_OK = { S: [8.2, 5.4], e: [7.4, 4.2], a: [4.5, 1.2], b: [1.5, 4.2], c: [2.0, 7.0], d: [4.8, 6.8] };
  const F_PASS = { S: [7.4, 4.2], e: [7.8, 1.2], a: [4.5, 1.2], b: [1.5, 4.2], c: [2.0, 7.0], d: [4.8, 6.8] };
  const F_OVL = { S: [8.2, 5.4], e: [7.4, 4.2], a: [4.6, 7.4], b: [1.5, 4.2], c: [2.0, 7.0], d: [4.6, 5.6] };
  const F_FRONT = { S: [7.6, 3.0], e: [7.4, 4.2], a: [4.5, 1.2], b: [1.5, 4.2], c: [2.0, 7.0], d: [4.8, 6.8] };
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
    { // hide1 – setter in position 1, serve receive (P2 drops back to pass, setter hides behind)
      id: 'hide1', kind: 'spot', correct: 1,
      spots: [[7.6, 0.5], [8.2, 5.4], [3.6, 7.8], [6.0, 4.5]],
      pl: { S: [9.9, 9.6], a: [4.5, 1.2], b: [1.5, 4.2], c: [2.0, 7.0], d: [4.8, 6.8], e: [7.4, 4.2] }, ghost: ['S'], slots: { S: 1, e: 2, a: 3, b: 4, c: 5, d: 6 },
      sol: [{ moves: { S: [8.2, 5.4] } }, { label: 'afterServe', moves: { S: T } }],
      t: {
        en: { q: 'The opponent serves. Our setter is in position 1. #14 (position 2) has dropped back to pass. Where does the setter stand?', o: ['A – at the net, in front of #14', 'B – directly behind #14', 'C – left of #9', 'D – in the passing line next to #14'], x: 'In position 1 the setter only has to be behind position 2 (#14) and to the right of position 6 (#9). In our system #14 drops back into the passing line and the setter stands directly behind #14 – so the setter does not pass, and the moment the serve is hit, runs forward past #14 to the target. A is a positional fault (in front of 2), C too (left of 6), and in D the setter would have to pass.' },
        ru: { q: 'Подаёт соперник. Наш связующий в зоне 1. №14 (зона 2) отошёл назад на приём. Где стоит связующий?', o: ['A – у сетки перед №14', 'B – прямо за №14', 'C – левее №9', 'D – в линии приёма рядом с №14'], x: 'В зоне 1 связующий должен быть только позади игрока зоны 2 (№14) и правее игрока зоны 6 (№9). У нас №14 отходит в линию приёма, а связующий встаёт прямо за ним – он не принимает, а в момент подачи пробегает мимо №14 вперёд на точку. A – ошибка расстановки (впереди зоны 2), C – тоже (левее зоны 6), в D ему пришлось бы принимать.' },
        de: { q: 'Der Gegner schlägt auf. Unser Zuspieler steht auf Position 1. #14 (Position 2) ist zur Annahme nach hinten gekommen. Wo steht der Zuspieler?', o: ['A – am Netz vor #14', 'B – direkt hinter #14', 'C – links von #9', 'D – in der Annahmereihe neben #14'], x: 'Auf Position 1 muss der Zuspieler nur hinter Position 2 (#14) und rechts von Position 6 (#9) stehen. Bei uns kommt #14 nach hinten in die Annahme, und der Zuspieler stellt sich direkt hinter #14 – er nimmt nicht an und läuft beim Aufschlag an #14 vorbei nach vorne zum Zielpunkt. A ist ein Aufstellungsfehler (vor Position 2), C ebenso (links von 6), bei D müsste er annehmen.' }
      }
    },
    { // form1 – receive formation with setter in position 1
      id: 'form1', kind: 'formation', correct: 1, forms: [F_OVL, F_OK, F_PASS, F_FRONT],
      pl: { S: STD.p1, e: STD.p2, a: STD.p3, b: STD.p4, c: STD.p5, d: STD.p6 }, slots: { S: 1, e: 2, a: 3, b: 4, c: 5, d: 6 },
      sol: [{ moves: F_OK }, { label: 'afterServe', moves: { S: T } }],
      t: {
        en: { q: 'Setter in position 1, the opponent serves. Which receive formation is correct?', o: ['A', 'B', 'C', 'D'], x: 'B: #14 (pos. 2) drops back and passes together with #11, #4 and #9, #7 stays at the net, and the setter stands directly behind #14 – legal, and the setter never has to pass. A: #7 (pos. 3) is behind #9 (pos. 6) → positional fault. C: the setter is in the passing line and would have to pass. D: the setter (pos. 1) is in front of #14 (pos. 2) → positional fault.' },
        ru: { q: 'Связующий в зоне 1, подаёт соперник. Какая расстановка на приёме правильная?', o: ['A', 'B', 'C', 'D'], x: 'B: №14 (зона 2) отходит назад и принимает вместе с №11, №4 и №9, №7 остаётся у сетки, а связующий стоит прямо за №14 – это разрешено, и связующему не нужно принимать. A: №7 (зона 3) позади №9 (зона 6) → ошибка расстановки. C: связующий в линии приёма и должен был бы принимать. D: связующий (зона 1) впереди №14 (зона 2) → ошибка расстановки.' },
        de: { q: 'Zuspieler auf Position 1, der Gegner schlägt auf. Welche Annahme-Aufstellung ist richtig?', o: ['A', 'B', 'C', 'D'], x: 'B: #14 (Pos. 2) kommt nach hinten und nimmt mit #11, #4 und #9 an, #7 bleibt am Netz, und der Zuspieler steht direkt hinter #14 – regelkonform, und er muss nie annehmen. A: #7 (Pos. 3) steht hinter #9 (Pos. 6) → Aufstellungsfehler. C: Der Zuspieler steht in der Annahmereihe und müsste annehmen. D: Der Zuspieler (Pos. 1) steht vor #14 (Pos. 2) → Aufstellungsfehler.' }
      }
    },
    { // hide2 – setter in position 2
      id: 'hide2', kind: 'spot', correct: 0,
      spots: [[7.0, 0.8], [7.3, 3.8], [3.4, 0.8], [7.4, 7.8]],
      pl: { S: [9.9, 3.0], a: [4.6, 1.2], b: [1.5, 4.0], c: [2.0, 7.0], d: [4.6, 6.8], e: [7.2, 5.4] }, ghost: ['S'], slots: { S: 2, a: 3, b: 4, c: 5, d: 6, e: 1 },
      sol: [{ moves: { S: [7.0, 0.8] } }, { label: 'afterServe', moves: { S: T } }],
      t: {
        en: { q: 'The setter is in position 2 (front right) and the opponent serves. Where does the setter wait?', o: ['A – at the net on the right, right next to the target', 'B – in the passing line', 'C – at the net, left of #7', 'D – behind #14 (position 1)'], x: 'Position 2 is the easiest rotation: the setter is already where the target is. The setter waits at the net on the right (right of #7, in front of #14) and only needs one or two steps. The other four players pass. C is a positional fault (2 must be right of 3), D too (2 must be in front of 1), B wastes the setter as a passer.' },
        ru: { q: 'Связующий в зоне 2 (впереди справа), подаёт соперник. Где он ждёт?', o: ['A – у сетки справа, рядом с точкой', 'B – в линии приёма', 'C – у сетки левее №7', 'D – позади №14 (зона 1)'], x: 'Зона 2 – самая простая расстановка: связующий уже стоит у точки. Он ждёт у сетки справа (правее №7, впереди №14), и ему нужен лишь шаг-два. Остальные четверо принимают. C – ошибка расстановки (зона 2 должна быть правее зоны 3), D – тоже (зона 2 впереди зоны 1), в B связующий тратится на приём.' },
        de: { q: 'Der Zuspieler steht auf Position 2 (vorne rechts), der Gegner schlägt auf. Wo wartet er?', o: ['A – rechts am Netz, direkt neben dem Zielpunkt', 'B – in der Annahmereihe', 'C – am Netz, links von #7', 'D – hinter #14 (Position 1)'], x: 'Position 2 ist die einfachste Rotation: Der Zuspieler steht schon dort, wo der Zielpunkt ist. Er wartet rechts am Netz (rechts von #7, vor #14) und braucht nur ein, zwei Schritte. Die anderen vier nehmen an. C ist ein Aufstellungsfehler (2 muss rechts von 3 stehen), D ebenso (2 muss vor 1 stehen), bei B wird der Zuspieler als Annahmespieler verschenkt.' }
      }
    },
    { // hide3 – setter in position 3
      id: 'hide3', kind: 'spot', correct: 0,
      spots: [[5.4, 0.8], [8.2, 0.8], [4.6, 4.0], [4.6, 7.9]],
      pl: { S: [4.6, 10.0], b: [1.5, 4.0], e: [7.4, 4.0], c: [2.0, 7.0], d: [4.6, 6.8], a: [7.4, 6.8] }, ghost: ['S'], slots: { S: 3, e: 2, b: 4, c: 5, d: 6, a: 1 },
      sol: [{ moves: { S: [5.4, 0.8] } }, { label: 'afterServe', moves: { S: T } }],
      t: {
        en: { q: 'The setter is in position 3 (middle front). #11 (pos. 4) and #14 (pos. 2) drop back to pass. Where does the setter wait?', o: ['A – at the net, slightly right of the middle', 'B – at the net, right of #14', 'C – in the middle of the passing line', 'D – behind #9 (position 6)'], x: 'In position 3 the setter must stay between position 4 (#11) and position 2 (#14) and in front of position 6 (#9). Because #14 drops back on the right, the setter can wait at the net already a bit right of the middle and slides to the target with one step. B is a positional fault (right of 2), D too (behind 6), and in C the setter would have to pass.' },
        ru: { q: 'Связующий в зоне 3 (впереди в центре). №11 (зона 4) и №14 (зона 2) отходят на приём. Где ждёт связующий?', o: ['A – у сетки чуть правее центра', 'B – у сетки правее №14', 'C – в центре линии приёма', 'D – позади №9 (зона 6)'], x: 'В зоне 3 связующий должен быть между зонами 4 (№11) и 2 (№14) и впереди зоны 6 (№9). Так как №14 отходит назад справа, связующий может ждать у сетки уже чуть правее центра и одним шагом выходит на точку. B – ошибка расстановки (правее зоны 2), D – тоже (позади зоны 6), в C ему пришлось бы принимать.' },
        de: { q: 'Der Zuspieler steht auf Position 3 (vorne Mitte). #11 (Pos. 4) und #14 (Pos. 2) kommen zur Annahme nach hinten. Wo wartet der Zuspieler?', o: ['A – am Netz, etwas rechts der Mitte', 'B – am Netz, rechts von #14', 'C – mitten in der Annahmereihe', 'D – hinter #9 (Position 6)'], x: 'Auf Position 3 muss der Zuspieler zwischen Position 4 (#11) und Position 2 (#14) und vor Position 6 (#9) stehen. Weil #14 rechts nach hinten geht, kann er schon etwas rechts der Mitte am Netz warten und ist mit einem Schritt am Zielpunkt. B ist ein Aufstellungsfehler (rechts von 2), D ebenso (hinter 6), bei C müsste er annehmen.' }
      }
    },
    { // hide4 – setter in position 4 (P3 and setter move closer together)
      id: 'hide4', kind: 'spot', correct: 0,
      spots: [[2.5, 0.9], [0.6, 0.8], [4.2, 0.8], [1.6, 6.6]],
      pl: { S: [-1.0, 4.6], a: [3.3, 1.1], e: [7.4, 3.6], c: [1.6, 5.0], d: [4.6, 6.0], b: [7.6, 5.6] }, ghost: ['S'], slots: { S: 4, a: 3, e: 2, b: 1, c: 5, d: 6 },
      sol: [{ moves: { S: [2.5, 0.9] } }, { label: 'afterServe', moves: { S: T, a: [3.0, 2.8] } }],
      t: {
        en: { q: 'The setter is in position 4 (front left). #7 (position 3) has moved a bit to the left. Where does the setter wait for the serve?', o: ['A – at the net, directly left of #7', 'B – at the net, at the left sideline', 'C – at the net, right of #7', 'D – behind #4'], x: 'In position 4 the setter must stay left of position 3 and in front of position 5. That is why #7 moves towards the setter and the setter stands directly left of #7 – both close together. Then the setter’s run to the target is much shorter than from the sideline (B, legal but too far). C is a positional fault (right of 3), D too (behind 5).' },
        ru: { q: 'Связующий в зоне 4 (впереди слева). №7 (зона 3) сместился немного влево. Где связующий ждёт подачу?', o: ['A – у сетки, сразу левее №7', 'B – у сетки у левой боковой линии', 'C – у сетки правее №7', 'D – позади №4'], x: 'В зоне 4 связующий должен быть левее зоны 3 и впереди зоны 5. Поэтому №7 смещается к связующему, а связующий встаёт сразу слева от него – оба рядом. Тогда бежать до точки гораздо ближе, чем от боковой линии (B – разрешено, но слишком далеко). C – ошибка расстановки (правее зоны 3), D – тоже (позади зоны 5).' },
        de: { q: 'Der Zuspieler steht auf Position 4 (vorne links). #7 (Position 3) ist etwas nach links gerückt. Wo wartet der Zuspieler auf den Aufschlag?', o: ['A – am Netz, direkt links von #7', 'B – am Netz an der linken Seitenlinie', 'C – am Netz, rechts von #7', 'D – hinter #4'], x: 'Auf Position 4 muss der Zuspieler links von Position 3 und vor Position 5 stehen. Deshalb rückt #7 zum Zuspieler, und der Zuspieler stellt sich direkt links neben #7 – beide eng zusammen. So ist sein Weg zum Zielpunkt viel kürzer als von der Seitenlinie (B, erlaubt, aber zu weit). C ist ein Aufstellungsfehler (rechts von 3), D ebenso (hinter 5).' }
      }
    },
    { // hide5 – setter in position 5: setter and position 3 prepare the switch
      id: 'hide5', kind: 'spot', correct: 0,
      spots: [[3.8, 3.4], [1.6, 7.6], [2.4, 1.6], [5.4, 3.6]],
      pl: { S: [-1.0, 7.4], b: [1.6, 3.0], a: [4.6, 0.9], c: [7.4, 3.6], d: [4.6, 6.4], e: [7.6, 6.0] }, ghost: ['S'], slots: { S: 5, b: 4, a: 3, c: 2, e: 1, d: 6 },
      sol: [{ moves: { S: [3.8, 3.4] } }, { label: 'afterServe', moves: { S: T, a: [2.6, 2.6] } }],
      t: {
        en: { q: 'The setter is in position 5 (back left) and the opponent serves. The setter and #7 (position 3) want to switch after the serve. Where does the setter wait?', o: ['A – just behind #11, in the middle next to #7', 'B – deep in the left back corner', 'C – in front of #11', 'D – right of #9'], x: 'Position 5 only has to be behind position 4 (#11) and left of position 6 (#9) – there is no rule between 5 and 3. So the setter moves up into the middle, just behind #11 and still left of #9, without crossing a rotation boundary. When the serve is hit they switch: the setter runs to the target and #7 goes to the left to attack. B is legal but far too far, C (in front of 4) and D (right of 6) are positional faults.' },
        ru: { q: 'Связующий в зоне 5 (сзади слева), подаёт соперник. После подачи связующий и №7 (зона 3) должны поменяться местами. Где ждёт связующий?', o: ['A – сразу за №11, в центре рядом с №7', 'B – глубоко в левом заднем углу', 'C – впереди №11', 'D – правее №9'], x: 'Игрок зоны 5 должен быть только позади зоны 4 (№11) и левее зоны 6 (№9) – между зонами 5 и 3 правила нет. Поэтому связующий выходит в центр, сразу за №11 и всё ещё левее №9, не нарушая расстановку. После удара по мячу они меняются: связующий бежит на точку, №7 уходит влево в атаку. B разрешено, но слишком далеко, C (впереди зоны 4) и D (правее зоны 6) – ошибки расстановки.' },
        de: { q: 'Der Zuspieler steht auf Position 5 (hinten links), der Gegner schlägt auf. Zuspieler und #7 (Position 3) wollen nach dem Aufschlag tauschen. Wo wartet der Zuspieler?', o: ['A – knapp hinter #11, in der Mitte bei #7', 'B – tief in der hinteren linken Ecke', 'C – vor #11', 'D – rechts von #9'], x: 'Position 5 muss nur hinter Position 4 (#11) und links von Position 6 (#9) stehen – zwischen 5 und 3 gibt es keine Regel. Der Zuspieler rückt also in die Mitte vor, knapp hinter #11 und noch links von #9, ohne eine Rotationsgrenze zu überschreiten. Beim Aufschlag tauschen sie: Der Zuspieler läuft zum Zielpunkt, #7 geht nach links zum Angriff. B ist erlaubt, aber viel zu weit, C (vor 4) und D (rechts von 6) sind Aufstellungsfehler.' }
      }
    },
    { // hide6 – setter in position 6
      id: 'hide6', kind: 'spot', correct: 0,
      spots: [[5.0, 1.9], [5.0, 0.45], [8.4, 2.6], [4.6, 7.7]],
      pl: { S: [4.6, 10.0], b: [1.5, 2.5], a: [5.0, 1.0], e: [7.5, 2.5], c: [1.5, 7.0], d: [7.5, 7.0] }, ghost: ['S'], slots: { S: 6, a: 3, b: 4, e: 2, c: 5, d: 1 },
      sol: [{ moves: { S: [5.0, 1.9] } }, { label: 'afterServe', moves: { S: T } }],
      t: {
        en: { q: 'The setter is in position 6 (middle back). #7 stands at the net in position 3. Where should the setter stand before the serve?', o: ['A – directly behind #7', 'B – in front of #7 at the net', 'C – right of #9 (position 1)', 'D – deep in the middle'], x: 'Position 6 only has to be behind position 3 and between positions 5 and 1. If #7 stays at the net, the setter stands right behind #7 and is only a few steps from the target. B is a positional fault (in front of 3), C too (right of position 1), D is legal but far away and in the passing zone.' },
        ru: { q: 'Связующий в зоне 6 (сзади в центре). №7 стоит у сетки в зоне 3. Где связующему стоять до подачи?', o: ['A – прямо за №7', 'B – перед №7 у сетки', 'C – правее №9 (зона 1)', 'D – глубоко в центре'], x: 'Игрок зоны 6 должен быть только позади зоны 3 и между зонами 5 и 1. Если №7 остаётся у сетки, связующий встаёт прямо за ним – до точки всего пара шагов. B – ошибка расстановки (впереди зоны 3), C – тоже (правее зоны 1), D разрешено, но далеко и в зоне приёма.' },
        de: { q: 'Der Zuspieler steht auf Position 6 (hinten Mitte). #7 steht auf Position 3 am Netz. Wo sollte der Zuspieler vor dem Aufschlag stehen?', o: ['A – direkt hinter #7', 'B – vor #7 am Netz', 'C – rechts von #9 (Position 1)', 'D – tief in der Mitte'], x: 'Position 6 muss nur hinter Position 3 und zwischen Position 5 und 1 stehen. Bleibt #7 am Netz, stellt sich der Zuspieler direkt hinter #7 und hat nur ein paar Schritte zum Zielpunkt. B ist ein Aufstellungsfehler (vor 3), C ebenso (rechts von Position 1), D ist erlaubt, aber weit weg und mitten in der Annahme.' }
      }
    },
    { // cover6 – who covers the middle back when the setter (pos. 6) hides
      id: 'cover6', kind: 'player', opts: ['c', 'b', 'd', 'a'], correct: 0,
      pl: { S: [5.0, 1.9], a: [5.0, 1.0], b: [1.5, 2.5], e: [7.5, 2.5], c: [1.5, 7.0], d: [7.5, 7.0] }, slots: { S: 6, a: 3, b: 4, e: 2, c: 5, d: 1 }, hl: ['S'],
      sol: [{ moves: { c: [3.8, 7.0], b: [1.6, 5.2] } }, { moves: { e: [7.4, 4.0], d: [7.4, 6.6] } }, { label: 'afterServe', moves: { S: T } }],
      t: {
        en: { q: 'The setter (position 6) hides behind #7 – now nobody is in the middle back. Who covers the middle back in serve receive?', o: ['#4 (position 5)', '#11 (position 4)', '#9 (position 1)', '#7 (position 3)'], x: 'Position 5 (#4) slides into the middle back, and position 4 (#11) drops into #4’s spot on the left. #11 stays a little closer to the net than #4, so the order is still legal. #14 drops back to pass on the right.' },
        ru: { q: 'Связующий (зона 6) прячется за №7 – теперь в центре сзади никого нет. Кто закрывает центр сзади на приёме?', o: ['№4 (зона 5)', '№11 (зона 4)', '№9 (зона 1)', '№7 (зона 3)'], x: 'Игрок зоны 5 (№4) сдвигается в центр назад, а игрок зоны 4 (№11) отходит на место №4 слева. №11 остаётся чуть ближе к сетке, чем №4, поэтому расстановка остаётся правильной. №14 отходит на приём справа.' },
        de: { q: 'Der Zuspieler (Position 6) versteckt sich hinter #7 – jetzt steht hinten in der Mitte niemand. Wer deckt die Mitte hinten in der Annahme ab?', o: ['#4 (Position 5)', '#11 (Position 4)', '#9 (Position 1)', '#7 (Position 3)'], x: 'Position 5 (#4) rückt in die Mitte nach hinten, und Position 4 (#11) geht auf den Platz von #4 links zurück. #11 bleibt dabei etwas näher am Netz als #4, damit die Aufstellung regelkonform bleibt. #14 kommt rechts zur Annahme nach hinten.' }
      }
    },
    { // fault – positional fault, with our setter-in-1 receive
      id: 'fault', kind: 'text', correct: 0,
      pl: { b: [1.6, 5.6], c: [1.9, 4.0], a: [4.5, 1.2], d: [4.8, 6.8], e: [7.4, 4.2], S: [8.2, 5.4] }, slots: { S: 1, e: 2, a: 3, b: 4, c: 5, d: 6 },
      sol: [{ bad: ['b', 'c'] }, { moves: { b: [1.5, 4.2], c: [2.0, 7.0] } }],
      t: {
        en: { q: 'Setter in position 1 behind #14, the opponent is about to serve. Which pair is in a positional fault? (The small numbers show each player’s position.)', o: ['Positions 4 and 5', 'Positions 3 and 6', 'Positions 2 and 1 (setter)', 'No fault'], x: 'At the serve each back-row player must be further from the net than the front-row player in front of them (1 behind 2, 6 behind 3, 5 behind 4), and the left/right order must be kept in each row. The setter behind #14 is fine – but position 5 (#4) is closer to the net than position 4 (#11) → fault.' },
        ru: { q: 'Связующий в зоне 1 за №14, соперник сейчас подаст. Какая пара нарушает расстановку? (Маленькие цифры – зоны игроков.)', o: ['Зоны 4 и 5', 'Зоны 3 и 6', 'Зоны 2 и 1 (связующий)', 'Ошибки нет'], x: 'В момент подачи каждый игрок задней линии должен быть дальше от сетки, чем игрок передней линии перед ним (1 за 2, 6 за 3, 5 за 4), и в каждой линии сохраняется порядок слева направо. Связующий за №14 стоит правильно – но зона 5 (№4) ближе к сетке, чем зона 4 (№11) → ошибка.' },
        de: { q: 'Zuspieler auf Position 1 hinter #14, der Gegner schlägt gleich auf. Welches Paar macht einen Aufstellungsfehler? (Die kleinen Zahlen zeigen die Position.)', o: ['Positionen 4 und 5', 'Positionen 3 und 6', 'Positionen 2 und 1 (Zuspieler)', 'Kein Fehler'], x: 'Beim Aufschlag muss jeder Hinterspieler weiter vom Netz weg sein als der Vorderspieler vor ihm (1 hinter 2, 6 hinter 3, 5 hinter 4), und in jeder Reihe muss die Links-rechts-Reihenfolge stimmen. Der Zuspieler hinter #14 steht richtig – aber Position 5 (#4) steht näher am Netz als Position 4 (#11) → Fehler.' }
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
    { // block – front-row setter blocks on the right
      id: 'block', kind: 'spot', correct: 0,
      spots: [[7.4, 0.4], [7.0, 3.4], [4.6, 0.4], [6.2, 4.6]],
      pl: { S: [6.2, 1.2], a: [4.5, 0.8], b: [1.5, 1.0], c: [1.6, 6.8], d: [4.6, 7.4], e: [7.5, 6.8] }, opp: [[7.5, -1.6]], ball0: [7.5, -1.9],
      sol: [{ moves: { S: [7.4, 0.4], a: [6.5, 0.4] } }, { ball: [[7.5, -1.9], [6.3, -3.4]], h: 0.8 }],
      t: {
        en: { q: 'Rally: our setter is in the front row. The opponent attacks from our right side. What does the setter do?', o: ['A – blocks on the right at the net', 'B – drops back to the 3 m line', 'C – blocks in the middle', 'D – goes back to defend'], x: 'A front-row setter blocks on the right side against the opponent’s outside hitter, and the middle player (#7) closes the block. After the block the setter turns and is already right next to the target for the next set.' },
        ru: { q: 'Розыгрыш: наш связующий на передней линии. Соперник атакует с нашей правой стороны. Что делает связующий?', o: ['A – блокирует справа у сетки', 'B – отходит на линию 3 м', 'C – блокирует в центре', 'D – уходит назад в защиту'], x: 'Связующий передней линии блокирует справа против доигровщика соперника, а центральный (№7) закрывает блок. После блока связующий разворачивается и уже стоит рядом с точкой для следующей передачи.' },
        de: { q: 'Ballwechsel: Unser Zuspieler steht im Vorderfeld. Der Gegner greift über unsere rechte Seite an. Was macht der Zuspieler?', o: ['A – blockt rechts am Netz', 'B – geht zur 3-m-Linie zurück', 'C – blockt in der Mitte', 'D – geht nach hinten in die Abwehr'], x: 'Ein Zuspieler im Vorderfeld blockt auf der rechten Seite gegen den Außenangreifer des Gegners, und der Mittelspieler (#7) schließt den Block. Nach dem Block dreht er sich um und steht schon direkt am Zielpunkt für das nächste Zuspiel.' }
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
    { // badpass – setter chases a bad pass
      id: 'badpass', kind: 'text', correct: 0,
      pl: { S: T, b: [1.5, 2.6], a: [4.5, 2.4], e: [7.5, 3.0], c: [1.8, 6.8], d: [4.6, 7.0] }, ball0: [1.9, 6.4],
      sol: [{ moves: { S: [4.2, 4.4] }, ball: [[1.9, 6.4], [4.2, 4.2]], h: 2.5 }, { moves: { b: [1.2, 1.2] }, ball: [[4.2, 4.2], [1.2, 0.8]], h: 4.5 }],
      t: {
        en: { q: 'Rally: #4 passes badly – the ball comes down in the middle, about 4 m from the net. What does the setter do?', o: ['Runs to the ball and sets a high ball to the left side', 'Stays at the target and waits', 'Always calls “Help!” and lets someone else play', 'Plays it straight back over the net'], x: 'The setter takes every second ball they can reach – even a bad one. From deep in the court a high, safe set to the outside (left) is best, so the attacker has time to get ready. “Help!” is only for balls the setter cannot reach or when the setter played the first ball.' },
        ru: { q: 'Розыгрыш: №4 неточно принимает – мяч падает в центре, примерно в 4 м от сетки. Что делает связующий?', o: ['Бежит к мячу и даёт высокую передачу в зону 4', 'Остаётся на точке и ждёт', 'Всегда кричит «Помоги!» и отдаёт мяч другим', 'Сразу переводит мяч через сетку'], x: 'Связующий берёт каждый второй мяч, до которого может добежать, – даже неточный. Из глубины площадки лучше всего высокая, надёжная передача на край (в зону 4), чтобы нападающий успел подготовиться. «Помоги!» – только если мяч не достать или связующий сыграл первое касание.' },
        de: { q: 'Ballwechsel: #4 nimmt schlecht an – der Ball kommt in der Mitte, etwa 4 m vom Netz, herunter. Was macht der Zuspieler?', o: ['Läuft hin und spielt einen hohen Ball nach außen links', 'Bleibt am Zielpunkt stehen und wartet', 'Ruft immer „Hilfe!“ und lässt einen anderen spielen', 'Spielt ihn direkt übers Netz zurück'], x: 'Der Zuspieler spielt jeden zweiten Ball, den er erreichen kann – auch einen schlechten. Aus der Tiefe des Feldes ist ein hoher, sicherer Pass nach außen (links) am besten, damit der Angreifer Zeit hat. „Hilfe!“ gilt nur für Bälle, die er nicht erreicht, oder wenn er selbst den ersten Ball gespielt hat.' }
      }
    },
    { // coveratt – cover the attacker
      id: 'coveratt', kind: 'spot', correct: 1,
      spots: [[6.2, 1.0], [2.4, 2.4], [4.5, 8.4], [8.6, 4.0]],
      pl: { S: T, b: [1.3, 0.9], a: [4.4, 2.4], e: [7.4, 2.8], c: [1.8, 6.6], d: [4.6, 7.0] }, opp: [[1.4, -0.5], [2.4, -0.5]], ball0: [1.3, 0.4],
      sol: [{ moves: { S: [2.4, 2.4], a: [3.4, 2.8], c: [1.6, 3.8] } }, { ball: [[1.3, 0.4], [2.4, 2.1]], h: 1 }],
      t: {
        en: { q: 'Rally: the setter has just set #11 on the left. The opponent puts up a double block. Where does the setter go now?', o: ['A – stays at the target', 'B – close behind #11 to cover the block', 'C – back to the end line', 'D – to the right sideline'], x: 'After the set the setter does not stand still: together with #7 and #4 they form a “cup” close behind the attacker. If the ball comes back off the block, it can be dug and the rally goes on.' },
        ru: { q: 'Розыгрыш: связующий только что отдал передачу №11 в зону 4. Соперник ставит двойной блок. Куда теперь идёт связующий?', o: ['A – остаётся на точке', 'B – близко за №11, чтобы страховать блок', 'C – назад к лицевой линии', 'D – к правой боковой линии'], x: 'После передачи связующий не стоит на месте: вместе с №7 и №4 он образует «полукруг» страховки прямо за нападающим. Если мяч отскочит от блока, его можно поднять, и розыгрыш продолжится.' },
        de: { q: 'Ballwechsel: Der Zuspieler hat gerade zu #11 nach links gestellt. Der Gegner stellt einen Doppelblock. Wohin geht der Zuspieler jetzt?', o: ['A – bleibt am Zielpunkt stehen', 'B – dicht hinter #11 zur Blocksicherung', 'C – zurück an die Grundlinie', 'D – an die rechte Seitenlinie'], x: 'Nach dem Zuspiel bleibt der Zuspieler nicht stehen: Zusammen mit #7 und #4 bildet er einen „Sicherungskreis“ dicht hinter dem Angreifer. Prallt der Ball vom Block zurück, kann er aufgenommen werden und der Ballwechsel geht weiter.' }
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
    { // free ball – setter defends from base right back
      id: 'free', kind: 'spot', correct: 1,
      spots: [[7.5, 7.6], [6.2, 1.0], [1.4, 0.8], [4.5, 4.5]],
      pl: { S: [7.5, 6.8], b: [1.5, 1.5], a: [4.5, 1.5], e: [7.5, 1.5], d: [4.5, 7.0], c: [1.6, 6.8] }, opp: [[4.5, -3.2]], ball0: [4.5, -3.5],
      sol: [{ moves: { S: T, b: [1.5, 3.4], a: [4.5, 3.4], e: [7.6, 3.4] }, ball: [[4.5, -3.5], [4.5, 6.6]], h: 3 }, { ball: [[4.5, 6.6], [6.2, 0.7]], h: 3.5 }],
      t: {
        en: { q: 'Rally: the opponent can only send an easy “free ball”. Our setter is in the back row and – as always after the serve – stands at the base position right back. What does the setter do?', o: ['A – stays right back and passes', 'B – runs straight to the target', 'C – goes to the left front at the net', 'D – waits in the middle of the court'], x: 'In a rally a back-row setter is never at position 5: right after the serve they switch to the base position right back. As soon as it is clear that a free ball is coming, the setter calls “Free!” and runs to the target – the others pass. The front-row players drop back to the 3 m line for their run-up.' },
        ru: { q: 'Розыгрыш: соперник может отправить только лёгкий «свободный мяч». Наш связующий на задней линии и, как всегда после подачи, стоит на своём месте сзади справа. Что он делает?', o: ['A – остаётся сзади справа и принимает', 'B – сразу бежит на точку', 'C – идёт вперёд налево к сетке', 'D – ждёт в центре площадки'], x: 'В розыгрыше связующий задней линии никогда не стоит в зоне 5: сразу после подачи он переходит на своё место сзади справа. Как только понятно, что летит свободный мяч, он кричит «Free!» / «Свободный!» и бежит на точку – принимают другие. Игроки передней линии отходят к линии 3 м для разбега.' },
        de: { q: 'Ballwechsel: Der Gegner kann nur einen leichten „Freeball“ rüberspielen. Unser Zuspieler ist im Hinterfeld und steht – wie immer nach dem Aufschlag – auf seiner Grundposition hinten rechts. Was macht er?', o: ['A – bleibt hinten rechts und nimmt an', 'B – läuft sofort zum Zielpunkt', 'C – geht nach vorne links ans Netz', 'D – wartet in der Feldmitte'], x: 'Im Ballwechsel steht ein Zuspieler im Hinterfeld nie auf Position 5: Direkt nach dem Aufschlag wechselt er auf seine Grundposition hinten rechts. Sobald klar ist, dass ein Freeball kommt, ruft er „Free!“ und läuft zum Zielpunkt – die anderen nehmen an. Die Vorderspieler gehen für den Anlauf zur 3-m-Linie zurück.' }
      }
    }
  ];
  self.QUIZ = { T, jersey, questions: Q };
})();

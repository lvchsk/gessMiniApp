export interface CafeGuideStep {
  id: string;
  asset: string;
  body: string;
  answers: readonly string[];
}

export const CAFE_GUIDE_STEPS: readonly CafeGuideStep[] = [
  {
    id: 'denis-hello',
    asset: '/assets/denis_1.webp',
    body: 'Ты как раз вовремя!\n\nУ нас тут постоянно разные гости спрашивают о каких-то кепках.\n\nТолько вот времени нет с ними разбираться — делаю Б.',
    answers: ['Что за кепки?', 'Делай Б'],
  },
  {
    id: 'denis-bag',
    asset: '/assets/denis_2.webp',
    body: 'Возможно...\n\nНет, тебе точно будет интересно!\n\nКороче, появился у нас магический мешочек.\n\nГлянь.',
    answers: ['Глянуть', 'Показывай'],
  },
  {
    id: 'denis-caps',
    asset: '/assets/denis_4.webp',
    body: 'Тут этих кепок куча!\n\nНе смог выбрать одну.\n\nТрижды подумаю, как она из рук пропадает...\n\nВозможно, нужно ждать физических отправлений.',
    answers: ['Как только', 'Так сразу'],
  },
  {
    id: 'denis-date',
    asset: '/assets/denis_3.webp',
    body: 'Загляни сам, покопайся в мешочке...\n\nКстати, хочешь узнать долгожданную дату отправлений? Надоел календарик?',
    answers: ['Хочу', 'Надоел'],
  },
  {
    id: 'denis-runner',
    asset: '/assets/denis_5.webp',
    body: 'За 1000 ничегошек из игрового автомата расскажу её тебе.\n\nТам как раз везти эти кепки нужно.',
    answers: ['В автомат!'],
  },
  {
    id: 'maxgess-finale',
    asset: '/assets/maxgess.webp',
    body: 'Вжжжиииу.\n\nЧуть не разбился!\n\nЧего не сделаешь ради ничегошек.\n\nЕсли что-то упустил — за кепку у кассы дерни!',
    answers: ['Погнали'],
  },
];

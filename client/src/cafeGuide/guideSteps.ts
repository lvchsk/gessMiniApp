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
    body: 'Ты как раз вовремя!\nУ нас тут постоянно разные гости спрашивают о каких-то кепках.\nТолько вот времени нет с ними разбираться — делаю Б.',
    answers: ['Что за кепки?', 'Делаю Б'],
  },
  {
    id: 'denis-bag',
    asset: '/assets/denis_2.webp',
    body: 'Возможно...\nНет, тебе точно будет интересно!\nКороче, появился у нас магический мешочек. Глянь.',
    answers: ['Глянуть', 'Показывай'],
  },
  {
    id: 'denis-caps',
    asset: '/assets/denis_3.webp',
    body: 'Тут этих кепок куча! Не смог выбрать одну. Трижды подумаю, как она из рук пропадает... Возможно, нужно ждать физических отправлений.',
    answers: ['Понял', 'Буду ждать'],
  },
  {
    id: 'denis-date',
    asset: '/assets/denis_4.webp',
    body: 'Хочешь узнать долгожданную дату отправлений, надоел календарик?',
    answers: ['Хочу', 'Надоел'],
  },
  {
    id: 'denis-runner',
    asset: '/assets/denis_5.webp',
    body: 'За 3500 ничегошек из игрового автомата расскажу её тебе. Там как раз везти эти кепки нужно.',
    answers: ['В автомат!'],
  },
  {
    id: 'maxgess-finale',
    asset: '/assets/maxgess.webp',
    body: 'Вжжжиииу.\nЧуть не разбился!\nЧего не сделаешь ради ничегошек.\nЕсли что-то упустил — за кепку у кассы дерни!',
    answers: ['Погнали'],
  },
];

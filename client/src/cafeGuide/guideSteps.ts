import denis1Asset from './assets/denis_1.png';
import denis2Asset from './assets/denis_2.png';
import denis3Asset from './assets/denis_3.png';
import denis4Asset from './assets/denis_4.png';
import denis5Asset from './assets/denis_5.png';
import maxgessAsset from './assets/maxgess.png';

export interface CafeGuideStep {
  id: string;
  asset: string;
  body: string;
  answers: readonly string[];
}

export const CAFE_GUIDE_STEPS: readonly CafeGuideStep[] = [
  {
    id: 'denis-hello',
    asset: denis1Asset,
    body: 'Ты как раз вовремя!\nУ нас тут постоянно разные гости спрашивают о каких-то кепках.\nТолько вот времени нет с ними разбираться — делаю Б.',
    answers: ['Что за кепки?', 'Делаю Б'],
  },
  {
    id: 'denis-bag',
    asset: denis2Asset,
    body: 'Возможно...\nНет, тебе точно будет интересно!\nКороче, появился у нас магический мешочек. Глянь.',
    answers: ['Глянуть', 'Показывай'],
  },
  {
    id: 'denis-caps',
    asset: denis3Asset,
    body: 'Тут этих кепок куча! Не смог выбрать одну. Трижды подумаю, как она из рук пропадает... Возможно, нужно ждать физических отправлений.',
    answers: ['Понял', 'Буду ждать'],
  },
  {
    id: 'denis-date',
    asset: denis4Asset,
    body: 'Хочешь узнать долгожданную дату отправлений, надоел календарик?',
    answers: ['Хочу', 'Надоел'],
  },
  {
    id: 'denis-runner',
    asset: denis5Asset,
    body: 'За 3500 ничегошек из игрового автомата расскажу её тебе. Там как раз везти эти кепки нужно.',
    answers: ['В автомат!'],
  },
  {
    id: 'maxgess-finale',
    asset: maxgessAsset,
    body: 'Вжжжиииу.\nЧуть не разбился!\nЧего не сделаешь ради ничегошек.\nЕсли что-то упустил — за кепку у кассы дерни!',
    answers: ['Погнали'],
  },
];

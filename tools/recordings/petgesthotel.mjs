// PetGestHotel (Yii2, in progress): the landing page, "sobre nós", sign in and sign up.
const base = 'http://localhost/PetGestHotel/petgesthotel/frontend/web/';
const css = '#yii-debug-toolbar{display:none!important}';
export default {
  name: 'petgesthotel-scroll',
  clips: [
    { url: base, css, record: [{ wait: 1300 }, { sections: { maxStops: 5 } }, { wait: 300 }, { top: 1600 }, { wait: 400 }] },
    { url: base + 'site/about', css, record: [{ wait: 1300 }, { sections: { maxStops: 3, hold: 1100 } }, { top: 1300 }, { wait: 400 }] },
    { url: base + 'site/login', css, record: [{ wait: 2600 }] },
    { url: base + 'site/signup', css, record: [{ wait: 2600 }] },
  ],
};

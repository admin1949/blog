const autoSlider = require('../../autoSlider');


module.exports = {
  title: "1m37",
  description: "1m37's blog",
  // plugins: ['vuepress-plugin-autobar'],
  themeConfig: {
    nav: [
      { text: 'GitHub', link: 'https://github.com/admin1949', target: '__black' },
    ],
    sidebar: autoSlider(),
  }
}
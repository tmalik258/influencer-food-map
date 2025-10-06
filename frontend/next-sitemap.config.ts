import { IConfig } from 'next-sitemap'

const config: IConfig = {
  siteUrl: 'https://nomtok.com', // 👈 your live domain
  generateRobotsTxt: true,       // also creates robots.txt automatically
  changefreq: 'weekly',
  priority: 0.7,
}

export default config

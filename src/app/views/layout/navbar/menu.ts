import { MenuItem } from './menu.model';

export const MENU: MenuItem[] = [
  {
    label: 'Cuestionario',
    icon: 'home',
    link: '/cuestionario',
    roles: ['usuario'],
  },
  {
    label: 'Reportes',
    icon: 'mail',
    roles: ['GEN25'],
    subMenus: [
      {
        subMenuItems: [
          {
            label: 'Email',
            isTitle: true,
          },
          {
            label: 'Inbox',
            link: '/apps/email/inbox'
          },
          {
            label: 'Read',
            link: '/apps/email/read'
          },
          {
            label: 'Compose',
            link: '/apps/email/compose'
          },
        ]
      },
      {
        subMenuItems: [
          {
            label: 'Other',
            isTitle: true,
          },
          {
            label: 'Chat',
            link: '/apps/chat',
          },
          {
            label: 'Calendar',
            link: '/apps/calendar',
            badge: {
              variant: 'primary',
              text: 'Event',
            }
          },
        ]
      }
    ]
  },
  
  
];

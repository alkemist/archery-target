import {MenuItem} from 'primeng/api';

interface DataModelMenuItem extends MenuItem {
    service: string,
    addRouterLink: string[],
    listRouterLink: string[],
}

export const BaseMenuItems: MenuItem[] = [
    {
        label: $localize`Target`,
        icon: 'fa fa-bullseye',
        routerLink: ['/shooting'],
    },
    {
        separator: true
    },
]

export const DataModelMenuItems: DataModelMenuItem[] = [
    /*{
        label: $localize`Shootings`,
        service: 'shooting',
        addRouterLink: ['/', 'shooting'],
        listRouterLink: ['/', 'shootings'],
    },*/
]

export const LoginMenuItem = {
    label: `Login`,
    icon: "pi pi-user",
    routerLink: ['/', 'login'],
};

export const LogoutMenuItem = {
    label: $localize`Sign out`,
    icon: 'pi pi-sign-out',
};

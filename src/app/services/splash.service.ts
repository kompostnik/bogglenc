import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class SplashService {

    time: number = 0;

    initialize(): Promise<boolean> {
        return new Promise((resolve, reject) => {
            try {
                this.time = new Date().getTime()
                const splashDiv = document.createElement('div');
                const splashBgDiv = document.createElement('div');
                const splashFgDiv = document.createElement('div');

                splashDiv.classList.add('splash');
                splashDiv.id = 'splash';

                splashBgDiv.classList.add('splash-bg');
                splashBgDiv.classList.add('splash');

                splashFgDiv.classList.add('splash-fg');
                splashFgDiv.classList.add('splash');
                splashFgDiv.classList.add('fade-in');


                const titleHolderDiv = document.createElement('div');
                const titleH1 = document.createElement('h1');
                const spinnerHolderDiv = document.createElement('div');
                const spinnerSpan = document.createElement('span');

                titleH1.innerHTML = 'Bogglenc'
                titleHolderDiv.style.color = 'white'
                titleHolderDiv.appendChild(titleH1)

                spinnerHolderDiv.classList.add('d-flex', 'justify-content-center')
                spinnerSpan.classList.add('spinner-border', 'spinner-border-sm')
                spinnerHolderDiv.appendChild(spinnerSpan)
                splashFgDiv.appendChild(titleHolderDiv).appendChild(spinnerHolderDiv);

                splashBgDiv.appendChild(splashFgDiv);
                splashDiv.appendChild(splashBgDiv);

                document.body.appendChild(splashDiv);
            } catch (e) {
                console.error(e);
            }
            resolve(true);
        });
    }

    destroy(): Promise<boolean>{
        return new Promise((resolve, reject) => {
            const end = new Date().getTime()
            let splashDestroyMilis = 200;
            if((end - this.time) < 500) {
                splashDestroyMilis = 1000;
            }
            try {
                const splashScreen: HTMLElement | null = document.getElementById(
                    'splash'
                );
                if (splashScreen) {
                    setTimeout(function () {
                        // start the transition out (exit)
                        splashScreen.classList.add('fade-out');

                        // remove from DOM after exit is finished
                        setTimeout(function () {
                            splashScreen.remove();
                        }, 500);
                    }, splashDestroyMilis);
                }
            } catch (e) {
                console.error(e);
            }
            resolve(true);
        })
    }
}
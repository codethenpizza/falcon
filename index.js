import {Falcon} from "./falcon.js";

export const App = new Falcon({
    data: {
        title: 'oh, hi Mark!',
        // computed
        titleLength() {
            return this.title.length
        }
    },
    watch: {
        title() {
            console.log('Title was changed!')
        }
    }
})

window.updateText = (key, e) => {
    App.data[key] = e.target.value
}

window.logApp = () => {
    console.log('log', App)
}
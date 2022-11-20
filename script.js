'use strict';

// prettier-ignore


const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

class Workout {
    date = new Date();
    id = Date.now() + ''.slice(-10)
    clicks = 0;


    constructor(coords, distance, duration) {
        //

        this.coords = coords; // [lat, lng]
        this.distance = distance; // in km
        this.duration = duration;// in min

    }

    //func para gerar do mes e dia
    _setDescription() {
        const months =
            ['January', 'February', 'March', 'April', 'May',
                'June', 'July', 'August', 'September', 'October',
                'November', 'December'
            ];
        this.description = `
        ${this.type[0].toUpperCase()}${this.type.slice(1)} on 
        ${months[this.date.getMonth()]}
        ${this.date.getDate()}
        `
    }
    click() {
        this.clicks++
    }
}

class Running extends Workout {
    //esse type sera usado mais abaixo para validacoes de campos
    type = 'running'
    constructor(coords, distance, duration, cadence) {
        super(coords, distance, duration)
        this.cadence = cadence;
        //n tem problemas chamar um method dentro do constructor
        this.calcPace()
        this._setDescription()
    }
    calcPace() {
        //min/km
        this.pace = this.duration / this.distance
        return this.pace
    }
}

class Cycling extends Workout {
    //esse type sera usado mais abaixo para validacoes de campos
    type = 'cycling'
    constructor(coords, distance, duration, elevationGain) {
        super(coords, distance, duration)
        this.elevationgains = elevationGain;
        this.calcSpeed()
        this._setDescription()
    }
    calcSpeed() {
        this.speed = this.distance / (this.duration / 60);
        return this.speed;
    }
}

//teste das class criada acima
// const run1 = new Running([39, -12], 5.2, 24, 178)
// const cycle1 = new Cycling([39, -12], 27, 80, 500)
// console.log(run1, cycle1)


class App {
    #map
    #mapEvent
    #workouts = []
    //mapZoomLevel serve para dizer o nivel de proximidade q o mapa vai ser carregado
    #mapZoomLevel = 15

    //assim q a class for chamada o constructor vai carregar oq tiver dentro dele
    // no caso o method _getPosition()
    constructor() {
        //user positions
        this._getPosition()

        //data do local storage
        this._getLocalStorage()


        form.addEventListener('submit', this._newWorkouts.bind(this))
        inputType.addEventListener('change', this._toggleElevationField)
        // evento para mostrar no mapa quando vc clica em um 
        containerWorkouts.addEventListener('click', this._moveTopopup.bind(this))
    }
    _getPosition() {
        if (navigator.geolocation)
            navigator.geolocation.getCurrentPosition(this._loadMap.bind(this), function errorLocation() {
                alert('localizacao nao encontrada');
            })
    }
    _loadMap(positions) {

        const { latitude, longitude } = positions.coords;
        // console.log(`https://www.google.com/maps/@${latitude},${longitude}`)
        const coord = [latitude, longitude]

        //codigo pronto do leaflet
        // essa variavel armazena os dados do L.map para q possamos trabalhar nele
        this.#map = L.map('map').setView(coord, this.#mapZoomLevel);

        //tipo do mapa usando. da para trocar por outros tipo pesquisar depois
        L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(this.#map);

        //marcacao da localizacao no mapa com um balao e texto


        //esse metodo 'on' e proprio do leaflet

        this.#map.on('click', this._showForm.bind(this))

        this.#workouts.forEach(work => {
            this._renderWorkoutMarket(work)
        })


    }
    _showForm(mapE) {
        this.#mapEvent = mapE
        form.classList.remove('hidden')
        inputDistance.focus()
    }

    _hideForm() {
        inputDistance.value = inputDuration.value = inputCadence.value = inputElevation.value = ''
        form.style.display = 'none'
        form.classList.add('hidden')
        setTimeout(() => { form.style.display = 'grid', 1000 })

    }

    _toggleElevationField() {
        inputElevation.closest('.form__row').classList.toggle('form__row--hidden')
        inputCadence.closest('.form__row').classList.toggle('form__row--hidden')
    }
    _newWorkouts(e) {

        // !Number.isFinite(distance) ||
        // !Number.isFinite(duration) ||
        // !Number.isFinite(cadence)
        //o codigo abaixo faz a mesma coisa q o codigo acima
        //checa se algum desse esta recebendo um valor valido(numero)
        const validInputs = (...inputs) =>
            inputs.every(inp => Number.isFinite(inp))

        //checa se o valor e positivo
        const allPositive = (...inputs) => inputs.every(inp => inp > 0)

        e.preventDefault()

        //pegando os dados do form
        const type = inputType.value
        const distance = +inputDistance.value
        const duration = +inputDuration.value
        const elevation = +inputElevation.value
        const cadence = +inputCadence.value
        const { lat, lng } = this.#mapEvent.latlng
        let workout;

        //check se os dados sao validos
        if (type === 'running') {
            const cadence = +inputCadence.value
            if (
                //chamada do codigo para validar se os valores sao numericos
                !validInputs(distance, duration, cadence) ||
                !allPositive(distance, duration, cadence)
            )
                return alert('Input have to be positive number')

            //criando um obj novo e pegando os dados vindos da variavel criada acima
            workout = new Running([lat, lng], distance, duration, cadence)

        }


        if (type === 'cycling') {
            const cadence = +inputElevation.value
            if (
                //chamada do codigo para validar se os valores sao numericos
                !validInputs(distance, duration, elevation) ||
                !allPositive(distance, duration)
            )
                return alert('Input have to be positive number')
            //criando um obj novo e pegando os dados vindos da variavel criada acima
            workout = new Cycling([lat, lng], distance, duration, elevation)
        }
        //inserindo um novo obj no workout array
        this.#workouts.push(workout)

        //chamada do method 
        this._renderWorkoutMarket(workout)

        //chamada do method 
        this._renderWorkout(workout)



        //limpando os campos
        this._hideForm()

        //guardando localmente as informacoes
        this._setLocalStorage()

    }

    //func para criar o balao no mapa cm as informacoes e a cor correta
    _renderWorkoutMarket(workout) {
        L.marker(workout.coords)
            .addTo(this.#map)
            .bindPopup(
                L.popup({
                    maxwidth: 250,
                    minWidth: 100,
                    autoClose: false,
                    closeOnClick: false,
                    //class para pegar a cor correta
                    className: `${workout.type}-popup`,
                })
            )
            //texto que ira dentro do balao no mapa
            .setPopupContent(`${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'} ${workout.description}`)
            .openPopup();

    }

    _renderWorkout(workout) {
        let html = `
        <li class="workout workout--${workout.type}" data-id="${workout.id}">
          <h2 class="workout__title">${workout.description}</h2>
          <div class="workout__details">
            <span class="workout__icon">${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'}</span>
            <span class="workout__value">${workout.distance}</span>
            <span class="workout__unit">km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">${workout.duration}</span>
            <span class="workout__unit">min</span>
          </div>`
        if (workout.type === 'running')
            html += `
          <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.pace.toFixed(1)}</span>
            <span class="workout__unit">min/km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">🦶🏼</span>
            <span class="workout__value">${workout.cadence}</span>
            <span class="workout__unit">spm</span>
          </div>
        </li>
          `
        if (workout.type === 'cycling')
            html += `
            <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.speed.toFixed(1)}</span>
            <span class="workout__unit">km/h</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⛰</span>
            <span class="workout__value">${workout.elevationGain}</span>
            <span class="workout__unit">m</span>
          </div>
        </li>
          `
        form.insertAdjacentHTML('afterend', html)
    }

    _moveTopopup(e) {
        const workoutEl = (e.target).closest('.workout')
        

        if (!workoutEl) return
        const workout = this.#workouts.find(
            work => work.id === workoutEl.dataset.id
        )
        console.log(workout)
        //func propia da API em caso de duvida checar na documentacao
        this.#map.setView(workout.coords, this.#mapZoomLevel, {
            animate: true,
            pan: {
                duration: 1
            }
        })
        //usando a interface publica
        // workout.click()
    }
    _setLocalStorage() {
        localStorage.setItem('workout', JSON.stringify(this.#workouts))
    }

    _getLocalStorage() {
        const data = JSON.parse(localStorage.getItem('workouts'))
        if (!data) return
        this.#workouts = data

        this.#workouts.forEach(work => {
            this._renderWorkout(work)

        })
    }
    //para apagar as informacoes
    reset(){
        localStorage.removeItem('workouts')
        //funcao propria do browser
        location.reload()
    }
}
const app = new App()
app._getPosition()









// const Person = function (name, date) {
//     this.name = name
//     this.date = date

//     function calc() {
//         return console.log('teste')
//     }
// }
// Person.prototype.sexo = 'm'
// Person.prototype.calc1 = function () {
//     console.log(2022 - this.date)
// }
// const bob = new Person('bob', 1991)

// console.log(bob instanceof Person)
// console.log(bob.__proto__)

// class PersonC {
//     constructor(first, age) {
//         this.first = first
//         this.age = age
//     }
//     calc() {
//         console.log(2022 - this.date)
//     }
// }

// const jess = new PersonC('jess', 1998)

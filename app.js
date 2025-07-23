const { createApp, ref, computed, onMounted } = Vue;

createApp({
  setup() {
    // Dades inicials
    const cars = ref(JSON.parse(localStorage.getItem('festesMajorsCars')) || []);
    const newCar = ref({
      driver: '',
      seats: 4,
      date: new Date().toISOString().split('T')[0],
      destination: '',
      passengers: []
    });
    
    const newPassengers = ref({});
    const currentDate = ref(new Date().toLocaleDateString('ca-ES'));
    const calculator = ref({
      people: 10,
      seatsPerCar: 4
    });
    
    // Computed
    const availableCars = computed(() => {
      return cars.value
        .filter(car => new Date(car.date) >= new Date(new Date().setHours(0, 0, 0, 0)))
        .sort((a, b) => new Date(a.date) - new Date(b.date));
    });
    
    const nextEvents = computed(() => {
      const events = {};
      
      availableCars.value.forEach(car => {
        if (!events[car.date]) {
          events[car.date] = {
            date: car.date,
            destination: car.destination,
            totalPeople: 0,
            totalSeats: 0
          };
        }
        
        events[car.date].totalPeople += car.passengers.length + 1; // +1 per al conductor
        events[car.date].totalSeats += car.seats;
      });
      
      return Object.values(events).map(event => {
        const carsNeeded = Math.ceil(event.totalPeople / 4); // Suposem 4 places per cotxe com a ideal
        const coveragePercent = Math.min(100, Math.round((event.totalSeats / event.totalPeople) * 100));
        
        return {
          ...event,
          carsNeeded,
          coveragePercent
        };
      }).slice(0, 3); // Mostra només les 3 properes
    });
    
    const driverStats = computed(() => {
      const stats = {};
      
      cars.value.forEach(car => {
        if (!stats[car.driver]) {
          stats[car.driver] = 0;
        }
        stats[car.driver]++;
      });
      
      const total = Object.values(stats).reduce((sum, count) => sum + count, 0);
      
      return Object.entries(stats)
        .map(([name, count]) => ({
          name,
          count,
          percentage: Math.round((count / total) * 100)
        }))
        .sort((a, b) => b.count - a.count);
    });
    
    const calculatedCars = computed(() => {
      return Math.ceil(calculator.value.people / calculator.value.seatsPerCar);
    });
    
    // Funcions
    function formatDate(dateString) {
      return luxon.DateTime.fromISO(dateString).setLocale('ca').toLocaleString(luxon.DateTime.DATE_FULL);
    }
    
    function addCar() {
      const car = {
        id: Date.now().toString(),
        ...newCar.value
      };
      
      cars.value.push(car);
      saveToLocalStorage();
      newCar.value = {
        driver: '',
        seats: 4,
        date: new Date().toISOString().split('T')[0],
        destination: '',
        passengers: []
      };
    }
    
    function joinCar(carId) {
      const passengerName = newPassengers.value[carId];
      if (!passengerName) return;
      
      const carIndex = cars.value.findIndex(c => c.id === carId);
      if (carIndex !== -1) {
        const car = cars.value[carIndex];
        if (car.passengers.length < car.seats) {
          car.passengers.push(passengerName);
          cars.value[carIndex] = { ...car };
          newPassengers.value[carId] = '';
          saveToLocalStorage();
        }
      }
    }
    
    function saveToLocalStorage() {
      localStorage.setItem('festesMajorsCars', JSON.stringify(cars.value));
    }
    
    // Inicialització
    onMounted(() => {
      // Creem alguns cotxes d'exemple si no n'hi ha
      if (cars.value.length === 0) {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const nextWeek = new Date(today);
        nextWeek.setDate(nextWeek.getDate() + 7);
        
        cars.value = [
          {
            id: '1',
            driver: 'Pere',
            seats: 3,
            date: tomorrow.toISOString().split('T')[0],
            destination: 'Vilafranca',
            passengers: ['Maria', 'Joan']
          },
          {
            id: '2',
            driver: 'Anna',
            seats: 5,
            date: nextWeek.toISOString().split('T')[0],
            destination: 'Sant Martí',
            passengers: ['Marc', 'Laura', 'Jordi']
          }
        ];
        
        saveToLocalStorage();
      }
    });
    
    return {
      cars,
      newCar,
      newPassengers,
      currentDate,
      calculator,
      availableCars,
      nextEvents,
      driverStats,
      calculatedCars,
      formatDate,
      addCar,
      joinCar
    };
  }
}).mount('#app');

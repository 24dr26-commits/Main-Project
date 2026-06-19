    // Set default date
    document.getElementById('depDate').valueAsDate = new Date();

    let flightsData = [];

    async function fetchFlightsData() {
      try {
        const response = await fetch('./flights.json');
        if (!response.ok) throw new Error("Failed to fetch flights");
        // Map mock API keys to our structure if needed, or just use them
        const rawData = await response.json();
        flightsData = rawData.map(f => ({
          name: f.airlineName,
          code: f.airlineCode,
          flightNumber: f.flightNumber,
          price: f.price,
          duration: f.duration,
          mins: f.durationMins,
          depart: f.departureTime,
          arrive: f.arrivalTime,
          stops: f.stops,
          availableSeats: f.availableSeats,
          status: f.status
        }));
      } catch (err) {
        console.error(err);
        alert("Could not load flight data. Please try again.");
      }
    }

    let currentSort = 'price';
    let activeFlightIndex = null;
    let renderedFlights = [];



    function swapCities() {
      const src = document.getElementById('src');
      const dst = document.getElementById('dst');
      const temp = src.value;
      src.value = dst.value;
      dst.value = temp;
    }

    function setSort(mode, index) {
      currentSort = mode;

      // Update toggle UI
      document.querySelectorAll('.toggle-opt').forEach(el => el.classList.remove('active'));
      document.querySelectorAll('.toggle-opt')[index].classList.add('active');

      const bg = document.getElementById('toggleBg');
      bg.style.left = index === 0 ? '4px' : '50%';
      bg.style.width = index === 0 ? 'calc(50% - 4px)' : 'calc(50% - 4px)';

      renderFlights();
    }

    function searchFlights() {
      const src = document.getElementById('src').value;
      const dst = document.getElementById('dst').value;

      document.getElementById('mainContent').style.display = 'block';
      document.getElementById('resultsTitle').textContent = `${src.split(' ')[0]} to ${dst.split(' ')[0]}`;
      document.getElementById('resultsSubtitle').textContent = `Curated for ${document.getElementById('cabinClass').value}`;

      // Initialize toggle background
      document.getElementById('toggleBg').style.width = 'calc(50% - 4px)';
      document.getElementById('toggleBg').style.left = '4px';

      // Show loader
      const list = document.getElementById('flightList');
      list.innerHTML = '';
      document.getElementById('loadingSpinner').style.display = 'flex';

      // Simulate network latency
      setTimeout(async () => {
        await fetchFlightsData();
        document.getElementById('loadingSpinner').style.display = 'none';
        renderFlights();
      }, 1200);

      // Smooth scroll to results
      setTimeout(() => {
        document.getElementById('mainContent').scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }

    function renderFlights() {
      const list = document.getElementById('flightList');
      list.innerHTML = '';

      renderedFlights = [...flightsData].sort((a, b) => {
        return currentSort === 'price' ? a.price - b.price : a.mins - b.mins;
      });

      const cheapest = Math.min(...renderedFlights.map(f => f.price));
      const fastest = Math.min(...renderedFlights.map(f => f.mins));

      renderedFlights.forEach((flight, i) => {
        let badges = '';
        if (flight.price === cheapest) badges += `<span class="flight-badge">Best Value</span> `;
        if (flight.mins === fastest) badges += `<span class="flight-badge" style="background:var(--navy);color:#fff">Fastest</span>`;

        const html = `
          <div class="flight-item delay-${(i % 5) + 1}">
            <div class="airline-info">
              <div class="airline-logo">${flight.code}</div>
              <div>
                <div class="airline-name">${flight.name}</div>
                ${badges}
              </div>
            </div>

            <div class="route-info">
              <div class="time-block">
                <div class="time">${flight.depart}</div>
                <div class="code">${document.getElementById('src').value.split(' ')[0]}</div>
              </div>
              
              <div class="journey-line">
                <div class="j-duration">${flight.duration}</div>
                <div class="j-line">
                  <i class="ti ti-plane j-plane"></i>
                </div>
                <div class="j-stops">${flight.stops}</div>
              </div>

              <div class="time-block">
                <div class="time">${flight.arrive}</div>
                <div class="code">${document.getElementById('dst').value.split(' ')[0]}</div>
              </div>
            </div>

            <div class="price-action">
              <div>
                <div class="price-amt">₹${flight.price.toLocaleString('en-IN')}</div>
                <div class="price-sub">per passenger</div>
              </div>
              <button class="btn-book" onclick="openModal(${i})">
                Reserve <i class="ti ti-arrow-narrow-right"></i>
              </button>
            </div>
          </div>
        `;
        list.insertAdjacentHTML('beforeend', html);
      });

      // Trigger animations
      setTimeout(() => {
        document.querySelectorAll('.flight-item').forEach(el => el.classList.add('show'));
      }, 50);
    }

    function updateModalSummary() {
      if (activeFlightIndex === null) return;
      const flight = renderedFlights[activeFlightIndex];
      const count = parseInt(document.getElementById('pCount').value) || 1;
      const total = flight.price * count;
      document.getElementById('modalSummary').innerHTML = `
        <h4>${flight.name}</h4>
        <p>${flight.depart} — ${flight.arrive} &bull; ${flight.duration}</p>
        <p style="margin-top:8px; font-weight:700; color:var(--accent);">Total (${count} Pax): ₹${total.toLocaleString('en-IN')}</p>
      `;
    }

    function openModal(index) {
      activeFlightIndex = index;
      document.getElementById('pCount').value = 1; // reset
      updateModalSummary();
      document.getElementById('bookingModal').classList.add('active');
    }

    function closeModal() {
      document.getElementById('bookingModal').classList.remove('active');
    }

    function proceedToPayment() {
      const name = document.getElementById('pName').value.trim();
      const email = document.getElementById('pEmail').value.trim();
      const phone = document.getElementById('pPhone').value.trim();
      const count = parseInt(document.getElementById('pCount').value) || 1;

      if (!name || !email || !phone) {
        alert("Please provide required details (Name, Email, Phone).");
        return;
      }

      // Save to localStorage
      const bookingData = { name, email, phone, passengers: count, flight: renderedFlights[activeFlightIndex] };
      localStorage.setItem('currentBooking', JSON.stringify(bookingData));

      closeModal();
      document.getElementById('mainContent').style.display = 'none';
      document.querySelector('.search-wrapper').style.display = 'none';
      document.querySelector('header').style.display = 'none';
      document.getElementById('paymentSection').style.display = 'block';
      window.scrollTo(0, 0);

      // Setup Payment view
      const base = bookingData.flight.price * count;
      const tax = Math.round(base * 0.18);
      const total = base + tax;
      
      document.getElementById('payPaxCount').innerText = count;
      document.getElementById('payBase').innerText = `₹${base.toLocaleString('en-IN')}`;
      document.getElementById('payTax').innerText = `₹${tax.toLocaleString('en-IN')}`;
      document.getElementById('payTotal').innerText = `₹${total.toLocaleString('en-IN')}`;

      // Save total for later
      localStorage.setItem('paymentAmount', total);
    }

    function goBackToSearch() {
      document.getElementById('paymentSection').style.display = 'none';
      document.querySelector('header').style.display = 'block';
      document.querySelector('.search-wrapper').style.display = 'block';
      document.getElementById('mainContent').style.display = 'block';
      window.scrollTo(0, 0);
    }

    function selectPaymentMethod(btn, method) {
      document.querySelectorAll('.method-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      if (method === 'card') {
        document.getElementById('cardFields').style.display = 'grid';
        document.getElementById('upiFields').style.display = 'none';
      } else {
        document.getElementById('cardFields').style.display = 'none';
        document.getElementById('upiFields').style.display = 'block';
      }
    }

    function processPayment() {
      const activeMethodBtn = document.querySelector('.method-btn.active');
      const method = activeMethodBtn.innerText.includes('UPI') ? 'UPI' : 'Credit/Debit Card';
      
      const bookingStr = localStorage.getItem('currentBooking');
      if (!bookingStr) {
        alert("Booking session expired. Start again.");
        return location.reload();
      }
      const booking = JSON.parse(bookingStr);
      const totalAmt = localStorage.getItem('paymentAmount');

      // Simple mock processing
      const payId = 'TXN' + Math.floor(Math.random() * 1000000000);
      const bkgId = 'BKG' + Math.floor(Math.random() * 1000000);

      document.getElementById('paymentSection').style.display = 'none';
      document.getElementById('ticketSection').style.display = 'block';
      window.scrollTo(0, 0);

      // Populate Ticket
      document.getElementById('ticBookingId').innerText = bkgId;
      document.getElementById('ticName').innerText = booking.name;
      document.getElementById('ticFlight').innerText = `${booking.flight.code}-${booking.flight.flightNumber || Math.floor(Math.random()*1000)} (${booking.flight.depart} - ${booking.flight.arrive})`;
      document.getElementById('ticPayId').innerText = payId;
      document.getElementById('ticAmount').innerText = `₹${Number(totalAmt).toLocaleString('en-IN')}`;
      document.getElementById('ticMethod').innerText = method;
      document.getElementById('ticDate').innerText = new Date().toLocaleString();
      
      // Save ticket data just in case
      localStorage.setItem('ticketData', JSON.stringify({bkgId, payId, booking, totalAmt, method}));
    }

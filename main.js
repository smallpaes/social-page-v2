(function () {
  const BASE_URL = 'https://lighthouse-user-api.herokuapp.com'
  const INDEX_URL = BASE_URL + '/api/v1/users/'
  const data = []
  const navbarGroup = document.querySelector('#navbar-group')
  const searchForm = document.getElementById('nav-search')
  const searchFormInput = document.querySelector('#nav-search input')
  const filterForm = document.getElementById('filter')
  let filteredData = []
  const dataPanel = document.querySelector('#data-panel')
  const myFavorite = document.querySelector('#my-favorite')
  const pagination = document.getElementById('pagination')
  let paginationData = []
  const ITEM_PER_PAGE = 12
  let currentPage = 1
  let onFavoritePage = false

  function displayAgeOptions(data) {
    const oldest = data.reduce((accumulator, currentValue) => Math.max(accumulator, currentValue.age), 0)
    const youngest = data.reduce((accumulator, currentValue) => Math.min(accumulator, currentValue.age), 99)

    const lastTier = Math.ceil(oldest / 5)
    const firstTier = Math.floor(youngest / 5)

    for (let i = firstTier; i < lastTier; i++) {
      document.getElementById('filter-age').innerHTML += `
        <div class="form-check form-check-inline">
          <input class="form-check-input" type="checkbox" id="tier${i}" value="${5 * i}" checked>
          <label class="form-check-label" for="tier${i}">${5 * i} - ${5 * i + 4}</label>
        </div>
      `
    }
  }

  function displayRegionOptions(data) {
    const regionData = []

    //find all unique country names
    data.forEach(item => {
      if (regionData.indexOf(item.region) < 0) regionData.push(item.region)
    })

    //place all unique country names into filter pannel
    regionData.sort().forEach(item => {
      document.getElementById('filter-region').innerHTML += `
        <option>${item}</option>
      `
    })
  }

  function updatePaginationStatus(pageNumber) {
    pagination.children[pageNumber].classList.toggle('active')
  }

  function getTotalPages(data) {
    let totalPages = Math.ceil(data.length / ITEM_PER_PAGE) || 1

    //add previous page link
    pagination.innerHTML = `
      <li class="page-item">
        <a class="page-link" href="#" aria-label="Previous" data-page='previous'>&laquo;</a>
      </li>
    `

    //add page number link
    for (let i = 0; i < totalPages; i++) {
      pagination.innerHTML += `
        <li class="page-item"><a class="page-link" href="#" data-page=${i + 1}>${i + 1}</a></li>
      `
    }

    //add next page link
    pagination.innerHTML += `
      <li class="page-item">
        <a class="page-link" href="#" aria-label="Next" data-page='next'>&raquo;</a>
      </li>
    `

    //add active status to first page link
    updatePaginationStatus(1)

    //upsate current page number
    currentPage = 1
  }

  function displayProfile(data) {
    dataPanel.innerHTML = data.map(person => {
      //if the profile has been selected as favorite add red-heart class
      redHeartClass = person.favorite === true ? 'red-heart' : ''
      //return display content
      return `
        <div class='col-md-6 col-xl-4 mb-4' id='profile'>
          <div class='card h-100 shadow'>
            <figure>
              <img src=${person.avatar} class='card-img-top' alt='profile photo' data-toggle='modal' data-target='#profileDetail' data-id='${person.id}'>
            </figure>
            <div class='card-body text-capitalize row'>
              <div class='col-10'>
                <h5 class='card-title'>${person.name} ${person.surname}</h5>
                <p class='card-text text-secondary'>
                  <i class='fas fa-map-marker-alt mr-2'></i>${person.region}
                </p>
              </div>
              <div class='col-2'>
                <h2><i class='fas fa-heart gray-heart ${redHeartClass}' data-id='${person.id}'></i></h2>
              </div>
            </div>
            <div class='card-footer text-muted text-center'>
              <a href='mailto:${person.email}' class='card-link'><i class='far fa-envelope pr-2'></i>Connect Now</a>
            </div>
          </div>
        </div>
      `
    }).join('')
  }

  function displayEmptyMessage() {
    dataPanel.innerHTML = `
      <div class='text-center mb-5' id='empty-message'>
        <h1><i class='far fa-grin-beam-sweat'></i></h1>
        <h3>No one is here</h3>
        <p class='my-3'>(Click <i class='fas fa-handshake'></i> on top to home page)</p>
      </div>
    `
  }

  function getPageData(pageNumber, data) {
    paginationData = data || paginationData

    if (paginationData.length === 0) return displayEmptyMessage()

    //if data is not empty, find page for the page
    let firstDisplayDataIndex = (pageNumber - 1) * ITEM_PER_PAGE
    let displayData = paginationData.slice(firstDisplayDataIndex, firstDisplayDataIndex + ITEM_PER_PAGE)

    //display the page
    displayProfile(displayData)
  }

  function updateFilterStatus() {
    //update gender and age sections
    const allInput = [...document.querySelectorAll('#filter input')]
    allInput.forEach(item => item.checked = true)

    //update region section
    document.querySelector('#filter-region').value = 'All'
  }

  function filterGender() {
    //select elements
    const genderChoices = [...document.querySelectorAll('#filter-gender input')]
    const maleCheck = genderChoices[0].checked
    const femaleCheck = genderChoices[1].checked

    if (maleCheck && femaleCheck) return filteredData
    if (maleCheck) return filteredData = filteredData.filter(item => item.gender === 'male')
    if (femaleCheck) return filteredData = filteredData.filter(item => item.gender === 'female')

    filteredData = []
  }

  function filterAge() {
    const ageChoices = [...document.querySelectorAll('#filter-age input')]
    let tempResult = []

    //find all age tierd that are checked
    const genderChecks = ageChoices.filter(item => item.checked === true)

    //find filtered data
    genderChecks.forEach(item => {
      const value = Number(item.value)
      const result = filteredData.filter(profile => Number(profile.age) >= value && Number(profile.age) < value + 5)
      tempResult = [...tempResult, ...result]
    })
    filteredData = tempResult
  }

  function filterRegion() {
    const regionChoice = document.querySelector('#filter-region').value
    if (regionChoice === 'All') return filteredData

    //find filtered data based on country selected
    filteredData = filteredData.filter(item => item.region === regionChoice)
  }

  function createFlag(region) {
    //modify country name for special regions
    if (region === 'England') region = 'United Kingdom'

    const modalFlag = document.getElementById('profile-detail-flag')
    const BASE_URL = 'https://restcountries.eu'
    const FLAG_URL = BASE_URL + '/rest/v2/name/' + region + '?fields=flag'

    //send request to REST Countries API
    axios
      .get(FLAG_URL)
      .then(response => modalFlag.src = response.data[0].flag)
      .catch(error => {
        modalFlag.src = ''
        console.log(error)
      })
  }

  function showProfileDetail(id) {
    //get elements
    const modalImage = document.getElementById('profile-detail-image')
    const modalName = document.getElementById('profile-detail-name')
    const modalAge = document.getElementById('profile-detail-age')
    const modalBirth = document.getElementById('profile-detail-birth')
    const modalRegion = document.getElementById('profile-detail-region')
    const modalGender = document.getElementById('profile-detail-gender')
    const modalEmail = document.getElementById('profile-detail-connect')

    //set request url
    const SHOW_API = INDEX_URL + id

    //send request to SHOW API
    axios
      .get(SHOW_API)
      .then(response => {
        const data = response.data
        modalImage.src = data.avatar
        modalName.textContent = `${data.name} ${data.surname}`
        modalAge.textContent = `Age: ${data.age}`
        modalBirth.textContent = `Born in: ${data.birthday}`
        modalRegion.textContent = `Nationality: ${data.region}`
        modalEmail.href = `mailto:${data.email}`
        modalGender.textContent = (data.gender === 'male') ? 'Male' : 'Female'
        createFlag(data.region)
      })
  }

  function removeFavoriteProfile(profile) {
    profile.parentElement.removeChild(profile)
    if (dataPanel.children.length === 0) displayEmptyMessage()
  }

  //Send request to Index API
  axios
    .get(INDEX_URL)
    .then(response => {
      response.data.results.forEach(profileData => {
        data.push({ ...profileData, favorite: false })
      })
      displayAgeOptions(data)
      displayRegionOptions(data)
      getTotalPages(data)
      getPageData(currentPage, data)
    })
    .catch(error => console.log(error))

  //add submit event to search form
  searchForm.addEventListener('submit', event => event.preventDefault())

  //add click event listener to navbar
  navbarGroup.addEventListener('click', event => {

    if (event.target.matches('.fa-handshake')) {
      getTotalPages(data)
      getPageData(currentPage, data)
      onFavoritePage = false
      updateFilterStatus()
      searchFormInput.value = ''
    } else if (event.target.matches('.favorite-btn')) {
      const favoriteData = data.filter(person => person.favorite)
      getTotalPages(favoriteData)
      getPageData(currentPage, favoriteData)
      onFavoritePage = true
    } else if (event.target.matches('.filter-btn')) {
      filterForm.classList.toggle('d-block')
    }
  })

  //add input event listener to form input
  searchFormInput.addEventListener('input', () => {
    onFavoritePage = false

    //create a regular expression
    const regex = new RegExp(searchFormInput.value, 'i')

    //find matching results
    const results = data.filter(item => `${item.name} ${item.surname}`.match(regex))

    //update pagination
    getTotalPages(results)

    //display results
    getPageData(currentPage, results)
  })

  //Add Event listener to filter Form
  filterForm.addEventListener('input', event => {
    onFavoritePage = false
    filteredData = data
    filterGender()
    filterAge()
    filterRegion()
    getTotalPages(filteredData)
    getPageData(currentPage, filteredData)
  })

  //Add event listener to dataPanel
  dataPanel.addEventListener('click', event => {
    if (event.target.matches('.card-img-top')) {
      showProfileDetail(event.target.dataset.id)
    } else if (event.target.matches('.fa-heart')) {
      event.target.classList.toggle('red-heart')
      let id = event.target.dataset.id

      //update profile data's favorite status 
      data[id - 1].favorite = data[id - 1].favorite ? false : true

      //if the user is on the favorite page remove that profile
      if (!onFavoritePage) { return }
      let profile = event.target.closest('#profile')
      removeFavoriteProfile(profile)
    }
  })

  //Add event listener to pagination
  pagination.addEventListener('click', event => {
    //remove pagination link active status
    updatePaginationStatus(currentPage)

    switch (event.target.dataset.page) {
      case 'previous':
        currentPage = currentPage - 1 || 1
        break
      case 'next':
        const totalPage = pagination.children.length - 2
        currentPage = Math.min(currentPage + 1, totalPage)
        break
      default:
        currentPage = Number(event.target.dataset.page)
    }
    //display page content
    getPageData(currentPage)

    //remove pagination link active status
    updatePaginationStatus(currentPage)
  })

})()
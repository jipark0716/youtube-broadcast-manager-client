const baseUrl = 'http://127.0.0.1:5862';

const loadStream = async () => {
    const response = await fetch(`${baseUrl}/streams`)
    let broadcasts = await response.json()
    broadcasts.sort((a, b) => a.resource.id > b.resource.id ? 1 : -1)

    const profileId = document.getElementById('broadcast-filter-channel').value
    if (profileId) {
        broadcasts = broadcasts.filter(o => o.profile_id === profileId)
    }


    const broadcastHtml = broadcasts.flatMap(o =>
        `<div class="card col-lg-3 col-4 p-0 ml-3 mr-3">
          <img class="card-img-top" src="${o.resource.snippet.thumbnails.high.url}" alt="Card image cap">
          <div class="card-body">
            <h5 class="card-title">${o.resource.snippet.title}</h5>
            <h5 class="card-title">${o.resource.snippet.description}</h5>
            <div class="btn-group" role="group" aria-label="Basic example">
              <a href="#" onclick="window.app.openInBrowser('https://youtube.com/live/${o.resource.id}')" class="btn btn-primary mr-1">방송 보기</a>
              <a href="#" onclick="stopLive('${o.resource.id}')" class="btn btn-danger">방송 종료</a>
            </div>
          </div>
        </div>`)

    document.querySelector('#broadcast .content').innerHTML = broadcastHtml.join("\n")
}
loadStream()
setInterval(loadStream, 2000)

const stopLive = async (streamId) => {
    const req = new FormData()
    req.append('stream_id', streamId)
    await fetch(`${baseUrl}/streams`, {
        method: 'delete',
        body: req
    })
}

const loadChannel = async () => {
    const response = await fetch(`${baseUrl}/channels`)
    const profiles = await response.json()

    const channelHtml = profiles.flatMap(profile =>
        profile.channels?.map(o =>
            `<div class="card col-lg-3 col-4 p-0 ml-3 mr-3" id="profile-${profile.profile.id}">
          <img class="card-img-top" src="${o.snippet.thumbnails.medium.url}" alt="Card image cap">
          <div class="card-body">
            <h5 class="card-title">${o.snippet.localized.title} (${o.snippet.customUrl || '설정 안됨'})</h5>
            <div class="btn-group" role="group" aria-label="Basic example">
              <a href="#" onclick="createLive('${profile.profile.id}')" class="btn btn-primary mr-1">방송시작</a>
              <a href="#" onclick="window.app.openInBrowser('https://www.youtube.com/channel/${o.id}')" class="btn btn-primary mr-1">채널보기</a>
              <a href="#" onclick="removeProfile('${profile.profile.id}')" class="btn btn-danger">X</a>
            </div>
          </div>
        </div>`)
    )

    document.querySelector('#channel .content').innerHTML = channelHtml.join("\n")

    let channelOptionHtml = profiles.flatMap(profile =>
        profile.channels.map(o =>
            `<option value="${profile.profile.id}">${o.snippet.localized.title} (${o.snippet.customUrl})</option>`
        )
    )
    let html = '<option value="">선택해주세요</option>' + channelOptionHtml.join("\n")
    if (document.getElementById('create-broadcast-0').innerHTML !== html) {
        document.getElementById('create-broadcast-0').innerHTML = html

    }

    channelOptionHtml = profiles.flatMap(profile =>
        profile.channels.map(o =>
            `<option value="${profile.profile.id}">${o.snippet.localized.title} (${o.snippet.customUrl})</option>`
        )
    )
    html = '<option value="">전체</option>' + channelOptionHtml.join("\n")
    if (document.getElementById('broadcast-filter-channel').innerHTML !== html) {
        document.getElementById('broadcast-filter-channel').innerHTML = html
    }

    return profiles;
}
loadChannel()
setInterval(loadChannel, 2000)

document.getElementById('broadcast-filter-channel').addEventListener('change', loadStream)

const removeProfile = async (id) => {
    document.getElementById(`profile-${id}`).remove()

    const req = new FormData()
    req.append('profile_id', id)
    await fetch(`${baseUrl}/profile`, {
        method: 'delete',
        body: req
    })
}

const loadCategories = async () => {
    const response = await fetch(`${baseUrl}/categories`)
    const categories = await response.json()

    const html = categories.items.filter(o => o?.snippet?.assignable).map(o =>
        `<option value="${o.id}">${o.snippet.title}</option>`
    )

    const h = html.join("\n")
    if (document.getElementById('create-broadcast-5').innerHTML !== h) {
        document.getElementById('create-broadcast-5').innerHTML = h
    }
}
loadCategories()
setInterval(loadCategories, 2000)

document.getElementById('select-thumbnail').addEventListener('click', async o => {
    const selectFile = await window.app.selectFile()

    if (selectFile.canceled || selectFile.filePaths.length < 1) {
        return
    }

    document.querySelector('#select-thumbnail img').src = `file:///${selectFile.filePaths[0]}`
    document.querySelector('#selected-thumbnail').value = selectFile.filePaths[0]
})

let runningUpload = false
document.getElementById('create-broadcast-4').addEventListener('click', async o => {
    if (runningUpload) return
    runningUpload = true

    const selectFile = await window.app.selectFile()

    if (selectFile.canceled || selectFile.filePaths.length < 1) {
        runningUpload = false
        return
    }

    o.target.value = `${selectFile.filePaths[0]}`
    document.getElementById('selected-source').value = selectFile.filePaths[0]
    runningUpload = false
})

window.app.addChannel(loadChannel)

const createLive = async (profileId = '') => {
    runningUpload = false
    document.querySelector('#create-broadcast form').reset()
    document.querySelector('#select-thumbnail img').src = 'https://cdn-icons-png.flaticon.com/512/54/54565.png'
    document.getElementById('create-broadcast-0').querySelectorAll('option').forEach(o => {
        o.selected = profileId === o.value
    })
    $('#create-broadcast').modal()
}

document.getElementById('start-broadcast').addEventListener('click', async o => {
    const form = document.querySelector('#create-broadcast form')
    const response = await fetch(`${baseUrl}/live-start`, {
        method: "POST",
        body: new FormData(form)
    })

    if (response.status === 200) {
        $('#create-broadcast').modal('hide')
        return
    }

    let message = '알수 없는 이유로 실패 했습니다.'

    try {
        const json = await response.json()
        if (json.message) {
            message = json.message
        }
    } catch (e) {

    }

    alert(message)
})

document.querySelectorAll('#app .nav .nav-item a').forEach((o,i, c) => {
    o.addEventListener('click', event => {
        c.forEach(o => o.classList.remove('active'))
        o.classList.add('active')
        document.querySelectorAll('#app .container').forEach(o => o.classList.add('d-none'))
        document.getElementById(o.dataset.tab).classList.remove('d-none')
    })
})
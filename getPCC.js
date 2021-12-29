const request = require('superagent')
const fs = require('fs')
const cheerio = require('cheerio')
require('superagent-charset')(request)//
let deepLen = ['province', 'city', 'county', 'town', 'village']
getresult()
let lastcurrentDeep = false
async function getresult() {
    let resdata = []
    let url="http://这是地址url/tjsj/tjbz/tjyqhdmhcxhfdm/2020"
    try {
        await getText(url, resdata)
        console.log(resdata);
        if (resdata.length !== 0) {
            fs.writeFileSync('./省市区.json', JSON.stringify(resdata))
        }
    } catch (e) {
        console.log(e.message);
    }
}
function getrequesturl(rooyUrl, url) {
    let indexurl = rooyUrl.lastIndexOf('/')
    let preUrl = rooyUrl.substring(0, indexurl)
    let uri = preUrl + '/' + url + '.html'
    
    process.stdout.write(process.platform === 'win32' ? '\x1Bc' : '\x1B[2J\x1B[3J\x1B[H')
    console.log(uri);
    return uri
}
async function getText(url, array = []) {

    let resdata = null
    try {
        sleep(5000);
        resdata = await testRequest(url)
        const result = resdata.text
        if (resdata && resdata.request && resdata.request.url) {
            let resUrl = resdata.request.url
            const $ = cheerio.load(result)
            let getPrivider = array
            await findclass($, getPrivider)
            if (!lastcurrentDeep) {
                for (let index = 0; index < getPrivider.length; index++) {
                    if (getPrivider[index].url) {
                        let uri = getrequesturl(resUrl, getPrivider[index].url)
                        await getText(uri, getPrivider[index].children)
                    }
                }
            } else {
                lastcurrentDeep = false
            }
        }
    } catch (e) {
        console.log(e);
    }
}

function sleep(delay) {
    for (var t = Date.now(); Date.now() - t <= delay;);
}

function findclass($, array = []) {
    let tables = $(`table`)
    let className = ""
    for (const key in tables) {
        if (tables[key].name === 'table') {
            if (tables[key].attribs.class) {
                className = tables[key].attribs.class.substring(0, tables[key].attribs.class.indexOf('table'))
            }
        }
    }
    // 这一步是获取层数 0 只获取省 1 获取省市 2 获取省市区   
    if (className === deepLen[2]) {
        lastcurrentDeep = true
    }
    if (className === deepLen[0]) {
        let childrens_a = $(`tr[class=${className}tr] td a`)
        for (const key in childrens_a) {
            let data = {}
            if (childrens_a[key].name === 'a') {
                if (childrens_a[key].children[0].type === 'text') {
                    data.value = childrens_a[key].children[0].data
                }
                data.children = []
                data.url = childrens_a[key].attribs.href.split('.')[0]
                array.push(data)
            }

        }
    } else {
        let childrens = $(`tr[class=${className}tr]`)
        for (const key in childrens) {
            let data = {}
            if (childrens[key].name === 'tr') {
                if (childrens[key].children) {
                    let len = childrens[key].children.length
                    if (childrens[key].children[len - 1].children) {
                        if (childrens[key].children[len - 1].children && childrens[key].children[len - 1].children[0].type === 'text') {
                            data.value = childrens[key].children[len - 1].children[0].data
                            data.children = []
                            data.url = ""
                        } else if (childrens[key].children[len - 1].children && childrens[key].children[len - 1].children[0].type === 'tag' && childrens[key].children[len - 1].children[0].name === 'a') {
                            let child = childrens[key].children[len - 1].children[0]
                            if (child.children[0].type === 'text') {
                                data.value = child.children[0].data
                            }
                            data.children = []
                            data.url = child.attribs.href.split('.')[0]
                        }
                    }
                }
                array.push(data)
            }

        }
    }


}


function testRequest(url) {
    return new Promise((resolve, reject) => {
        request.get(url)
            .buffer(true)
            .charset("gbk")
            .then(function (res) {
                resolve(res)
            })
            .catch((err) => {
                reject(err)
            })
    })

}
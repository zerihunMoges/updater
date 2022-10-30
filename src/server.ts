import express, { response } from 'express'
import bodyParser, { urlencoded } from 'body-parser'
import cors from 'cors'
import morgan from 'morgan'
import { configs } from './configs'
import { schedule } from './schedulers/schedulers'
import { results } from './results'

const fetch = require('node-fetch')
let fixtures
var index = 0
const keys = configs.apiTokens
console.log(keys)
export async function updateAllMatches() {
  await fetch(
    `https://api-football-beta.p.rapidapi.com/fixtures?league=39&season=2022`,
    {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': keys[index],
        'X-RapidAPI-Host': 'api-football-beta.p.rapidapi.com'
      }
    }
  )
    .then((res) => res.json())
    .then(async (data) => {
      index = (index + 1) % 5
      const { errors, paging, response } = data
      if (!errors || errors.length == 0) {
        for (const match of response) {
          const res = await fetch(`${configs.api}/api/matches`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ match: match })
          })
            .then((res) => res.json())
            .catch((err) => {
              console.log(err)
            })

          await new Promise((r) => setTimeout(r, 1000))
        }
        var today = new Date()
        var tomorrow = new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate() + 1
        )
        var dif = tomorrow.getTime() - today.getTime()
        schedule(updateAllMatches, dif)
      } else {
        const time = 60 * 1000
        schedule(updateAllMatches, time)
      }
    })
    .catch((err) => {
      console.log(err)
    })
}
export async function updateTodaysMatch() {
  const data = await fetch(
    `https://api-football-beta.p.rapidapi.com/fixtures?league=39&season=2022&date=${new Date()
      .toISOString()
      .slice(0, 10)}`,
    {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': keys[index],
        'X-RapidAPI-Host': 'api-football-beta.p.rapidapi.com'
      }
    }
  ).then(async (res) => await res.json())

  index = (index + 1) % 10
  const { paging, response } = data

  var today = new Date()
  var tomorrow = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate() + 1
  )
  var dif = tomorrow.getTime() - today.getTime()
  schedule(updateTodaysMatch, dif)
  return response
}

export async function getFixture(id) {
  try {
    const data = await fetch(
      `https://api-football-beta.p.rapidapi.com/fixtures?id=${id}`,
      {
        method: 'GET',
        headers: {
          'X-RapidAPI-Key': keys[index],
          'X-RapidAPI-Host': 'api-football-beta.p.rapidapi.com'
        }
      }
    ).then(async (res) => await res.json())
    index = (index + 1) % 10
    if (!data.errors || data.errors.length == 0) {
      await data.response.forEach(async (match) => {
        const { fixture, league, teams, goals, score, lineups, events } = match
        const {
          id,
          referee,
          timezone,

          date,
          timestamp,
          periods,
          venue,
          status
        } = fixture
        console.log(teams.home.name)
        console.log(new Date().toISOString())
        const res = await fetch(`${configs.api}/api/matches`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ match: data.response[0] })
        })
          .then(async (res) => await res.json())
          .catch((err) => {
            console.log(err)
            const time = 5000
            schedule(getFixture, time, id)
          })
        const stoped = new Set([
          'PST',
          'CANC',
          'TBD',
          'SUSP',
          'CANC',
          'ABD',
          'WO',
          'FT'
        ])
        const inprogress = new Set(['1H', '2H', 'P', 'ET', 'BT', 'HT'])
        if (stoped.has(status.short)) {
          return
        } else if (status.short == 'INT') {
          const time = 300000

          schedule(getFixture, time, id)
        } else if (status.short == 'NS') {
          const dif = new Date(date).getTime() - new Date().getTime()
          const time = dif
          if (lineups.home && lineups.home.startXI) {
            schedule(getFixture, Math.max(time, 30000), id)
          } else {
            console.log('rescheduled' + teams.home.name)
            const fiveMins = 300000
            schedule(getFixture, fiveMins, id)
          }
        } else if (inprogress.has(status.short)) {
          const time = 60000
          schedule(getFixture, time, id)
        }
      })
    } else return data
  } catch (err) {
    console.log(err)
    const time = 5000
    schedule(getFixture, time, id)
  }
}

schedule(updateAllMatches, 1)

if (fixtures == undefined) {
  async function runFixture() {
    fixtures = await schedule(updateTodaysMatch, 1)
    console.log(fixtures)
    fixtures.forEach(async (match) => {
      const matchTime = new Date(match.fixture.date).getTime()
      const hour = 3600000

      if (matchTime - new Date().getTime() <= hour) {
        schedule(getFixture, 1, match.fixture.id)
      } else {
        schedule(
          getFixture,
          matchTime - new Date().getTime() - hour,
          match.fixture.id
        )
      }
    })
  }

  runFixture()
}

'use client'

import Container from '@/components/Container'
import ForecastWeatherDetail from '@/components/ForecastWeatherDetail'
import Navbar from '@/components/Navbar'
import WeatherDetails from '@/components/WeatherDetails'
import WeatherIcon from '@/components/WeatherIcon'
import { convertKelvinToCelsius } from '@/utils/convertKelvinToCelsius'
import { convertWindSpeed } from '@/utils/convertWindSpeed'
import { metersToKilometers } from '@/utils/metersToKilometers'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { format, fromUnixTime, parseISO } from 'date-fns'
import { useAtom } from 'jotai'
import { loadingCityAtom, placeAtom } from './atom'
import { useEffect } from 'react'

interface WeatherData {
  cod: string
  message: number
  cnt: number
  list: WeatherEntry[]
  city: City
}

interface WeatherEntry {
  dt: number
  main: Main
  weather: Weather[]
  clouds: Clouds
  wind: Wind
  visibility: number
  pop: number
  sys: Sys
  dt_txt: string
}

interface Main {
  temp: number
  feels_like: number
  temp_min: number
  temp_max: number
  pressure: number
  sea_level: number
  grnd_level: number
  humidity: number
  temp_kf: number
}

interface Weather {
  id: number
  main: string
  description: string
  icon: string
}

interface Clouds {
  all: number
}

interface Wind {
  speed: number
  deg: number
  gust: number
}

interface Sys {
  pod: string
}

interface City {
  id: number
  name: string
  coord: Coord
  country: string
  population: number
  timezone: number
  sunrise: number
  sunset: number
}

interface Coord {
  lat: number
  lon: number
}

export default function Home() {
  const [place, setPlace] = useAtom(placeAtom)
  const [loadingCity, setLoadingCity] = useAtom(loadingCityAtom)

  const { isPending, error, data, refetch } = useQuery<WeatherData>({
    queryKey: ['repoData'],
    queryFn: async () => {
      const { data } = await axios.get(
        `https://api.openweathermap.org/data/2.5/forecast?q=${place}&appid=${process.env.NEXT_PUBLIC_WEATHER_KEY}&cnt=56`
      )
      return data
    },
  })

  useEffect(() => {
    refetch()
  }, [place, refetch])

  const firstData = data?.list[0]

  const uniqueDates = [
    ...new Set(
      data?.list.map(
        (entry) => new Date(entry.dt * 1000).toISOString().split('T')[0]
      )
    ),
  ]

  // Filtering data to get the first entry after 6 AM for each unique date
  const firstDataForEachDay = uniqueDates.map((date) => {
    return data?.list.find((entry) => {
      const entryDate = new Date(entry.dt * 1000).toISOString().split('T')[0]
      const entryTime = new Date(entry.dt * 1000).getHours()
      return entryDate === date && entryTime >= 6
    })
  })

  if (isPending)
    return (
      <div className="flex items-center justify-center min-h-screen ">
        <p className="animate-bounce">Loading...</p>
      </div>
    )

  if (error) return 'An error has occurred: ' + error.message

  return (
    <div className="flex flex-col gap-4 bg-gray-100 min-h-screen">
      <Navbar location={data.city.name} />
      <main className="px-3 max-w-7xl mx-auto flex flex-col gap-9 w-full pb-10 pt-4">
        {/* today data */}
        {loadingCity ? (
          <WeatherSkeleton />
        ) : (
          <>
            <section className="space-y-4">
              <div className="space-y-2">
                <h2 className="flex gap-1 text-2xl items-center">
                  <span>
                    {format(parseISO(firstData?.dt_txt ?? ''), 'EEEE')}
                  </span>
                  <span className="text-lg">
                    ({format(parseISO(firstData?.dt_txt ?? ''), 'dd.MM.yyyy')})
                  </span>
                </h2>
                <Container className="gap-10 px-6 items-center">
                  {/* temperature */}
                  <div className="flex flex-col px-4">
                    <span className="text-5xl">
                      {convertKelvinToCelsius(firstData?.main.temp ?? 296.37)}°
                    </span>
                    <p className="text-xs space-x-1 whitespace-nowrap">
                      <span>Feels like</span>
                      <span>
                        {convertKelvinToCelsius(
                          firstData?.main.feels_like ?? 0
                        )}
                        °
                      </span>
                    </p>
                    <p className="text-xs space-x-2">
                      <span>
                        {convertKelvinToCelsius(firstData?.main.temp_min ?? 0)}
                        °↓{' '}
                      </span>
                      <span>
                        {' '}
                        {convertKelvinToCelsius(firstData?.main.temp_max ?? 0)}
                        °↑
                      </span>
                    </p>
                  </div>
                  {/* time and weather icon */}
                  <div className="flex gap-10 sm:gap-16 overflow-x-auto w-full justify-between pr-3">
                    {data?.list.map((d, i) => (
                      <div
                        key={i}
                        className="flex flex-col justify-between gap-2 items-center text-xs font-semibold"
                      >
                        <p className="whitespace-nowrap">
                          {format(parseISO(d.dt_txt), 'h:mm a')}
                        </p>
                        <WeatherIcon iconName={d.weather[0].icon} />
                        <p>{convertKelvinToCelsius(d?.main.temp ?? 0)}°</p>
                      </div>
                    ))}
                  </div>
                </Container>
              </div>
              <div className="flex gap-4">
                {/* left */}
                <Container className="w-fit justify-center flex-col px-4 items-center">
                  <p className="capitalize text-center">
                    {firstData?.weather[0].description}
                  </p>
                  <WeatherIcon iconName={firstData?.weather[0].icon ?? ''} />
                </Container>
                {/* right */}
                <Container className="bg-yellow-400/80 px-6 gap-4 justify-between overflow-x-auto">
                  <WeatherDetails
                    visibility={metersToKilometers(
                      firstData?.visibility ?? 10000
                    )}
                    humidity={`${firstData?.main.humidity}%`}
                    windSpeed={convertWindSpeed(firstData?.wind.speed ?? 1)}
                    airPressure={`${firstData?.main.pressure} hPa`}
                    sunrise={format(
                      fromUnixTime(data?.city.sunrise ?? 1718658254),
                      'H:mm'
                    )}
                    sunset={format(
                      fromUnixTime(data?.city.sunset ?? 1718707547),
                      'H:mm'
                    )}
                  />
                </Container>
              </div>
            </section>
            {/* 7 day forecast data */}
            <section className="flex w-full flex-col gap-4">
              <p className="text-2xl">Forecast (7 days)</p>
              {firstDataForEachDay.map((d, i) => (
                <ForecastWeatherDetail
                  key={i}
                  description={d?.weather[0].description ?? ''}
                  weatherIcon={d?.weather[0].icon ?? '01d'}
                  date={format(parseISO(d?.dt_txt ?? ''), 'dd.MM')}
                  day={format(parseISO(d?.dt_txt ?? ''), 'EEEE')}
                  feels_like={d?.main.feels_like ?? 0}
                  temp={d?.main.temp ?? 0}
                  temp_max={d?.main.temp_max ?? 0}
                  temp_min={d?.main.temp_min ?? 0}
                  airPressure={`${d?.main.pressure} hPa`}
                  humidity={`${d?.main.humidity}%`}
                  sunrise={format(
                    fromUnixTime(data?.city.sunrise ?? 1718658254),
                    'H:mm'
                  )}
                  sunset={format(
                    fromUnixTime(data?.city.sunset ?? 1718707547),
                    'H:mm'
                  )}
                  visibility={`${metersToKilometers(d?.visibility ?? 10000)}`}
                  windSpeed={`${convertWindSpeed(d?.wind.speed ?? 1.64)}`}
                />
              ))}
            </section>
          </>
        )}
      </main>
    </div>
  )
}

function WeatherSkeleton() {
  return (
    <>
      <section className="space-y-4">
        <div className="space-y-2 animate-pulse">
          <h2 className="flex gap-1 text-2xl items-center">
            <span className="block bg-gray-300 h-8 w-24 rounded"></span>
            <span className="block bg-gray-300 h-6 w-32 rounded"></span>
          </h2>
          <div className="w-full bg-white border rounded-xl flex py-4 shadow-sm gap-10 px-6 items-center">
            {/* temperature */}
            <div className="flex flex-col px-4">
              <span className="block bg-gray-300 h-16 w-32 rounded"></span>
              <p className="text-xs space-x-1 whitespace-nowrap">
                <span className="block bg-gray-300 h-4 w-16 rounded"></span>
                <span className="block bg-gray-300 h-4 w-12 rounded"></span>
              </p>
              <p className="text-xs space-x-2">
                <span className="block bg-gray-300 h-4 w-12 rounded"></span>
                <span className="block bg-gray-300 h-4 w-12 rounded"></span>
              </p>
            </div>
            {/* time and weather icon */}
            <div className="flex gap-10 sm:gap-16 overflow-x-auto w-full justify-between pr-3">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="flex flex-col justify-between gap-2 items-center text-xs font-semibold"
                >
                  <span className="block bg-gray-300 h-4 w-16 rounded"></span>
                  <span className="block bg-gray-300 h-20 w-20 rounded-full"></span>
                  <span className="block bg-gray-300 h-4 w-12 rounded"></span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="flex gap-4">
          {/* left */}
          <div className="w-fit justify-center flex-col px-4 items-center bg-white border rounded-xl flex py-4 shadow-sm">
            <span className="block bg-gray-300 h-4 w-24 rounded"></span>
            <span className="block bg-gray-300 h-20 w-20 rounded-full"></span>
          </div>
          {/* right */}
          <div className="bg-yellow-400/80 px-6 gap-4 justify-between overflow-x-auto w-full bg-white border rounded-xl flex py-4 shadow-sm">
            <span className="block bg-gray-300 h-48 w-full rounded"></span>
          </div>
        </div>
      </section>
      {/* 7 day forecast data */}
      <section className="flex w-full flex-col gap-4 animate-pulse">
        <span className="block bg-gray-300 h-8 w-48 rounded"></span>
        {[...Array(7)].map((_, i) => (
          <div
            key={i}
            className="w-full bg-white border rounded-xl flex py-4 shadow-sm gap-4 px-6 items-center"
          >
            <span className="block bg-gray-300 h-16 w-16 rounded-full"></span>
            <div className="flex flex-col gap-1">
              <span className="block bg-gray-300 h-4 w-24 rounded"></span>
              <span className="block bg-gray-300 h-4 w-32 rounded"></span>
              <span className="block bg-gray-300 h-4 w-24 rounded"></span>
            </div>
          </div>
        ))}
      </section>
    </>
  )
}

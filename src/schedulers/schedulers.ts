export async function schedule(
  func: Function,
  time: number,
  param = undefined
) {
  await new Promise((r) => setTimeout(r, time))
  if (param) return await func(param)
  else return await func()
}

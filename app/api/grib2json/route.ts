import grib2json from "grib2json";

export async function GET(request: Request) {
    // const req = await request.json()
    const promise = new Promise<any>((resolve, reject) => {
        grib2json('/drive/Programming/javascript/uni-project-2026/public/perth.grb2', {
            scriptPath: '/drive/Programming/javascript/uni-project-2026/grib2json-0.8.0-SNAPSHOT/bin/grib2json',
            names: true,
            data: true
        }, function (err, json) {
            resolve(json);
        })
    })
    let out = await promise
    return Response.json({grib: out});
}
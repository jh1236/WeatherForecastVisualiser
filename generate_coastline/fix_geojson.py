from decimal import Decimal

import ijson
import json


class DecimalEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        return super().default(obj)


def main():
    trim_australian_coast('west_aus_coast_mp.json')

def trim_australian_coast(file_out):
    with open('aus_coast.json', 'rb') as fp_in, open(file_out, 'w') as fp_out:
        fp_out.write('{"type": "MultiPolygon", "coordinates": [')
        first = True
        for feature in ijson.items(fp_in, 'features.item', use_float=True):
            geometry_in = feature['geometry']
            geometry_out: dict[str, object] = dict(geometry_in.items())
            geometry_out['coordinates'] = []

            if geometry_in['type'] == 'MultiPolygon':
                ret = []
                for polygon in geometry_in['coordinates']:
                    polygon_ret = []
                    for i, layer in enumerate(polygon):
                        inner_ret = []
                        for lng, lat in layer:
                            if lng > 117.299616:
                                continue
                            else:
                                inner_ret.append((lng, lat))
                        if not inner_ret: continue
                        polygon_ret.append(inner_ret)
                    if not polygon_ret: continue
                    ret.append(polygon_ret)
                if not ret: continue
                ret.append(ret[0])
                geometry_out['coordinates'] = ret
            elif geometry_in['type'] == 'Polygon':
                ret = []
                max_lat = -1e10
                max_lng = -1e10
                min_lat = 1e10
                min_lng = 1e10
                for i in geometry_in['coordinates']:
                    inner_ret = []
                    for lng, lat in i[::2]:
                        if lng > 117.299616 or lng < 112.872389:
                            continue
                        if lat > -21.910402: continue
                        else:
                            max_lat = max(max_lat, lat)
                            min_lat = min(min_lat, lat)
                            max_lng = max(max_lng, lng)
                            min_lng = min(min_lng, lng)
                            inner_ret.append((lng, lat))
                    if not inner_ret: continue
                    ret.append(inner_ret)
                if not ret or (max_lat - max_lat < 0.01 and max_lng - min_lng < 0.01):
                    continue
                geometry_out['coordinates'] = ret
            if geometry_out['coordinates']:
                if geometry_out['type'] == 'MultiPolygon':
                    for i in geometry_out['coordinates']:
                        if not first:
                            fp_out.write(',')
                        json.dump(i, fp_out, cls=DecimalEncoder, separators=(',', ':'))
                        first = False
                else:
                    if not first:
                        fp_out.write(',')
                    feature['geometry'] = geometry_out
                    json.dump(geometry_out['coordinates'], fp_out, cls=DecimalEncoder, separators=(',', ':'))
                    first = False
                    
        fp_out.write(']}')


if __name__ == '__main__':
    main()

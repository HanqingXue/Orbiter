import json

def write_start_point(lat, lon):
	location = open('./static/data/facility.en.json')
	locDetail = json.load(location)
	location.close()
	
	locDetail['facilities']['beijing']['lat'] = lat
	locDetail['facilities']['beijing']['lon'] = lon
	
	with open('./static/data/facility.en.json', 'w') as out:
		out.write(json.dumps(locDetail))
		out.close()

def write_missile(distance, bearing):
	test_data = open('./static/data/test.en.json')
	test_detail = json.load(test_data)
	test_data.close()

	test_detail['timeBins'][0]['data'][0]['distance'] = distance
	test_detail['timeBins'][0]['data'][0]['bearing'] = bearing

	print '__Here__'
	print distance
	print bearing

	with open('./static/data/test.en.json', 'w') as test:
		test.write(json.dumps(test_detail))
		test.close()

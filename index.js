const { classCodes, discordToken, discordChannel } = require('./config.js');
const fetch = require('node-fetch');

async function getClasses() {
	const res = await fetch('https://scheduleofclasses.uark.edu/Main?strm=1213', {
		headers: {
			accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
			'accept-language': 'en-US,en;q=0.9',
			'cache-control': 'max-age=0',
			'content-type': 'application/x-www-form-urlencoded',
			'upgrade-insecure-requests': '1',
		},
		referrer: 'https://scheduleofclasses.uark.edu/?strm=1213',
		referrerPolicy: 'no-referrer-when-downgrade',
		body: 'campus=FAY&acad_career=&acad_group=ENGR&subject=CSCE&catalog_nbr1=&catalog_nbr2=&class_section=&session_code=&meeting_time_start_hours=&meeting_time_start_minutes=&meeting_time_start_ampm=&meeting_time_end_hours=&meeting_time_end_minutes=&meeting_time_end_ampm=&room_chrstc=&descr=&last_name=&first_name=&enrl_stat=&class_nbr=&facility_id=&Search=Search',
		method: 'POST',
		// mode: 'cors'
	});

	const body = await res.text();

	const courses = [];
	for (const code of Object.keys(classCodes)) {
		const match = body.match(new RegExp(`<[^>]+>(.*?)<[^>]+>\\n*\\t*<[^>]+>(CSCE${code})[\\s\\S]+?<td class="EnrolledSize">(\\d*\\/\\d*)`))
		courses.push({ code, status: match[1], seats: match[3] });
	}

	console.log(courses);
	return courses;
}

async function checkAvailability() {
	const courses = await getClasses();

	for (const course of courses)
		if (course.status === 'Open')
			await notifyForCourse(course);
}

async function notifyForCourse({ code, seats }) {
	const t = await fetch(`https://discord.com/api/v7/channels/${discordChannel}/messages`, {
		headers: {
			Authorization: `Bot ${discordToken}`,
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			content: `**CSCE${code} - ${classCodes[code]} is open**\nCurrent enrollment: ${seats}`
		}),
		method: 'POST'
	});
}

async function loop() {
	try {
		await checkAvailability();
	} catch (error) {
		console.error(error);
	}
}

loop();
setInterval(loop, 5 * 60e3);

var mysql = require('mysql');
var express = require('express');
var session = require('express-session');
var bodyParser = require('body-parser');
var path = require('path');
const PDFDocument = require("pdfkit-table");
const multer = require('multer');
var app= express();


app.set("view engine", "ejs"); 
app.set("views", __dirname + "/public"); 

app.use(express.static(path.join(__dirname, 'uploads')));
var connection = mysql.createConnection({
	host     : 'localhost',
	user     : 'root',
	password : '',
	database : 'forms'
});




const storage = multer.diskStorage({

	destination: function (req, file, cb) {
	  cb(null, path.resolve(__dirname, './uploads'))
	},
  
	filename: function (req, file, cb) {
	  cb(null, file.originalname)
	}
  });

var upload = multer({ storage: storage });

app.use(session({
	secret: 'secret',
	resave: true,
	saveUninitialized: true
}));
app.use(bodyParser.urlencoded({extended : true}));
app.use(bodyParser.json());

function buildPDF(dataCallback, endCallback, username, id){
	connection.query('SELECT * FROM form1 WHERE username = ? AND id = ?',[username,id],function(error, results, fields){
	const name = results[0].name;
	const phone = results[0].phone;
	const email = results[0].email;
	const dob = results[0].dob;
	const social_security = results[0].social_security;
	const doa = results[0].doa;
	const position = results[0].position;
	const daw = results[0].daw;
	const rights = results[0].rights;
	const current_address = results[0].current_address;
	const mailing_address = results[0].mailing_address;
	const previous_address = results[0].previous_address;
	const state=results[0].state;
	const license_no=results[0].license_no;
	const type=results[0].type;
	const endorsements=results[0].endorsements;
	const expiry_date=results[0].expiry_date;
	const coe=results[0].coe;
	const toe=results[0].toe;
	const date_from=results[0].date_from;
	const date_to=results[0].date_to;
	const miles=results[0].miles;
	const accident_date=results[0].accident_date;
	const noa = results[0].noa;
	const fatalities = results[0].fatalities;
	const injuries = results[0].injuries;
	const chemical_spills = results[0].chemical_spills;
	const date_convicted=results[0].date_convicted;
	const violation=results[0].violation;
	const state_violation=results[0].state_violation;
	const penalty = results[0].penalty;
	const denied_license= results[0].denied_license;
	const explanation1= results[0].explanation1;
	const suspended=results[0].suspended;
	const explanation2=results[0].explanation2;



	const doc = new PDFDocument({
		margin:30,
		size:'A4'
	});
	doc.on('data',dataCallback);
	doc.on('end', endCallback);
	doc.fontSize(18);
	doc.font('Times-Bold').fillColor('Black').text(`DRIVER EMPLOYMENT APPLICATION`, {
		width: 600,
		align: 'center',
	}).moveDown(0.5);
	doc.fontSize(16);
	doc.text(`Applicant Information\n\n`,{align:'left'});
	const table= {
		headers: ["Field","Value"],
		rows: [
			["Name",`${name}`],
			["Phone Number",`${phone}`],
			["Email",`${email}`],
			["Date of Birth",`${dob}`],
			["Social Security #",`${social_security}`],
			["Date of Application",`${doa}`],
			["Position Applied for",`${position}`],
			["Date Available for work",`${daw}`],
			["Do you have legal right to work in US?",`${rights}`]
		],
	};
	doc.table(table,{width:600});
	doc.fontSize(16);
	doc.font('Times-Bold').fillColor('Black').text(`Previous Residency Information`, {
		width: 600,
		align: 'left',
	}).moveDown(0.5);	
	const table2={
		headers: ["Field","Value"],
		rows: [
			["Current Address",`${current_address}`],
			["Mailing Address",`${mailing_address}`],
			["Previous Address",`${previous_address}`]
		],
	};
	doc.table(table2,{width:600});
	doc.fontSize(16);
	doc.font('Times-Bold').fillColor('Black').text(`License Information`, {
		width: 600,
		align: 'left',
	}).moveDown(0.5);
	const table3= {
		headers: ["Field","Value"],
		rows: [
			["State",`${state}`],
			["License #",`${license_no}`],
			["Type/Class",`${type}`],
			["Endorsements",`${endorsements}`],
			["Expiration Date",`${expiry_date}`]

		],
	};
	doc.table(table3,{width:600});
	const table4 = {
		headers: ["Field","Value"],
		rows: [
			["Class of Equipment",`${coe}`],
			["Type of Equipment",`${toe}`],
			["Date From",`${date_from}`],
			["Date to",`${date_to}`],
			["Approx # of Miles(TOTAL)",`${miles}`]
		],
	};

	doc.fontSize(16);

	doc.font('Times-Bold').fillColor('Black').text(`Driving Experience`, {
		width: 600,
		align: 'left',
	}).moveDown(0.5);
	
	
	doc.table(table4,{width:600});

	
	doc.end();

	});
}

app.get('/', function(request, response) {
	if (request.session.loggedin) {
		username=request.session.username;
		response.render("home");

} 
else {
	response.redirect('/login');
}
});

app.get('/login', function(request, response) {
	response.render("login");
});


app.get('/signup',function(request, response){
	response.render("signup");
});

app.post('/signup',function(request,response){
	var username = request.body.username;
	var password = request.body.password;
	var email = request.body.email;
	connection.query('SELECT * FROM accounts WHERE email=?',[email],function(error, results,fields){
		if(results.length > 0) {
			response.send('Email already exists. Try with a different email or use forgot password option');
			console.log("error");
		}

	})
	connection.query('SELECT * FROM accounts WHERE username=?',[username],function(error, results,fields){
		if(results.length > 0) {
			response.send('Username already exists. Try with a different email or use forgot password option');
			console.log("error");
		}
	connection.query('INSERT INTO accounts (username,password,email) VALUES (?,?,?)',[username,password,email],function(error,results,fields){
		if(error) throw error;
		response.redirect('/login')
	})
})
});

app.post('/auth', function(request, response) {
	var username = request.body.username;
	var password = request.body.password;
	if (username && password) {
		connection.query('SELECT * FROM accounts WHERE username = ? AND password = ?', [username, password], function(error, results, fields) {
			if(error) throw(error);
			if (results.length > 0) {
				var role = results[0];
				role = role.role;
				request.session.role= role;
				request.session.loggedin = true;
				request.session.username = username;
				response.redirect('/');
			} else {
				response.send('Incorrect Username and/or Password!');
			}			
			response.end();
		});
	} else {
		response.send('Please enter Username and Password!');
		response.end();
	}
});


app.get('/form1',function(request,response){
	response.render("form1");
})
app.get('/admin',function(request,response){
	if(request.session.role=='admin'){
	connection.query('SELECT * FROM form1',function(error,results,fields){
		if(results.length>0)
		{
			response.render("admin",{data:results});

		}
	})
}
	else{
		response.send('You dont have admin rights');
	}
})

app.post('/form1',upload.single('file'),function(request,response){
	if(request.session.loggedin='true')
	{
	var name=request.body.name;
	var phone=request.body.phone;
	var email= request.body.email;
	var dob=request.body.dob;
	var social_security=request.body.social_security;
	var doa=request.body.doa;
	var position=request.body.position;
	var daw=request.body.daw;
	var rights=request.body.rights;
	var current_address=request.body.current_address;
	var mailing_address=request.body.address;
	var previous_address=request.body.previous_address;
	var state=request.body.state;
	var license_no=request.body.license_no;
	var type=request.body.type;
	var endorsements=request.body.endorsements;
	var expiry_date=request.body.expiry_date;
	var coe=request.body.coe;
	var toe=request.body.toe;
	var date_from=request.body.date_from;
	var date_to=request.body.date_to;
	var miles=request.body.miles;
	var accident_date=request.body.accident_date;
	var noa = request.body.noa;
	var fatalities = request.body.fatalities;
	var injuries = request.body.injuries;
	var chemical_spills = request.body.chemical_spills;
	var date_convicted=request.body.date_convicted;
	var violation=request.body.violation;
	var state_violation=request.body.state_violation;
	var penalty = request.body.penalty;
	var denied_license= request.body.denied_license;
	var explanation1= request.body.explanation1;
	var suspended=request.body.suspended;
	var explanation2=request.body.explanation2;
	var username=request.session.username;


	connection.query('INSERT INTO form1 (username,name,email,dob,phone,social_security,doa,position,daw,rights,current_address,mailing_address,previous_address,state,license_no,type,endorsements,expiry_date,coe,toe,date_from,date_to,miles,accident_date,noa,fatalities,injuries,chemical_spills,date_convicted,violation,state_violation,penalty,denied_license,explanation1,suspended,explanation2) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',[username,name,email,dob,phone,social_security,doa,position,daw,rights,current_address,mailing_address,previous_address,state,license_no,type,endorsements,expiry_date,coe,toe,date_from,date_to,miles,accident_date,noa,fatalities,injuries,chemical_spills,date_convicted,violation,state_violation,penalty,denied_license,explanation1,suspended,explanation2],function(error,results,fields)
	{

		if(error) throw error;
		response.redirect('/');
	})
}
else{
	response.redirect('/login');
}

});

app.post('/pdf',function(request,response){
	var username=request.body.username;
	var id=request.body.id;

	const stream = response.writeHead(200, {
		'Content-Type': 'application/pdf',
		'Content-Disposition':'attachment;filename=general.pdf'
	});
	buildPDF(

		(chunk) => stream.write(chunk),
		() => stream.end(),
		username,
		id,
	);


});





app.listen(3000);

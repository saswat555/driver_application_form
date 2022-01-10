from flask import Flask, render_template, request, redirect, url_for, session
from flask_mysqldb import MySQL
import MySQLdb.cursors
import re
from datetime import datetime
from datetime import timedelta
import requests
import json
import pandas as pd
import googlemaps



app = Flask(__name__)
app.debug = True


app.secret_key = 'your secret key'

# Enter your database connection details below
app.config['MYSQL_HOST'] = 'localhost'
app.config['MYSQL_USER'] = 'root'
app.config['MYSQL_PASSWORD'] = ''
app.config['MYSQL_DB'] = 'hackathon'

# Intialize MySQL
mysql = MySQL(app)

regex = re.compile(r'([A-Za-z0-9]+[.-_])*[A-Za-z0-9]+@cmrit.ac.in')
def isValid(email):
    if re.fullmatch(regex, email):
      return (True)
    else:
      return (False)

selected_list=[]
def loc():
    list=[]
    data = pd.read_csv('bus.csv')
    for row in data.iterrows():
        list.append(row[1][0])
    return list


@app.route('/')
def index():
    if 'loggedin' in session:
        return redirect('/home')
    else:
        return render_template('login.html')


@app.route('/ownerlogin',methods=['GET', 'POST'])
def ownerlogin():
    msg = ''
    if request.method== 'GET':
        return render_template('ownerlogin.html',msg=msg)
    if request.method == 'POST' and 'email' in request.form and 'password' in request.form:
        email = request.form['email']
        if isValid(email)==False:
            msg="Email id does not belong to CMRIT"
            return render_template('ownerlogin.html', msg=msg)
        password = request.form['password']
        cursor = mysql.connection.cursor(MySQLdb.cursors.DictCursor)
        cursor.execute('SELECT * FROM owner WHERE email = %s AND password = %s', (email, password,))
        account = cursor.fetchone()
        if account:
            session['loggedin'] = True
            session['id'] = account['id']
            session['email'] = account['email']
            session['role']='owner'
            return redirect(url_for('ownerhome'))
        else:
            msg = 'Incorrect username/password!'
    return render_template('ownerlogin.html', msg=msg)


@app.route('/ownersignup',methods=['GET', 'POST'])
def ownersignup():
    msg=''
    if request.method== 'GET':
        return render_template('ownersignup.html')
    if request.method == 'POST':
        email = request.form['email']
        if isValid(email)==False:
            msg="Email id does not belong to CMRIT"
            return render_template('ownersignup.html', msg=msg)
        password = request.form['password']
        USN = request.form['usn']
        phone = request.form['phone']
        vehicle = request.form['vehicle']
        capacity = request.form['capacity']
        cursor = mysql.connection.cursor(MySQLdb.cursors.DictCursor)
        cursor.execute('INSERT INTO owner VALUES (NULL, %s, %s, %s,%s,%s,%s)', (USN, email, password, vehicle,capacity, phone,))
        mysql.connection.commit()
        msg="Signed in successfully"
        return render_template('ownerlogin.html',msg=msg)
    return "gadbad"

@app.route('/login', methods=['GET', 'POST'])
def login():
    msg = ''
    if request.method== 'GET':
        return render_template('login.html',msg=msg)
    if request.method == 'POST' and 'email' in request.form and 'password' in request.form:
        email = request.form['email']
        if isValid(email)==False:
            msg="Email id does not belong to CMRIT"
            return render_template('login.html', msg=msg)
        password = request.form['password']
        cursor = mysql.connection.cursor(MySQLdb.cursors.DictCursor)
        cursor.execute('SELECT * FROM user WHERE email = %s AND password = %s', (email, password,))
        account = cursor.fetchone()
        if account:
            session['loggedin'] = True
            session['id'] = account['id']
            session['email'] = account['email']
            session['role']='user'
            return redirect(url_for('home'))
        else:
            msg = 'Incorrect username/password!'
    return render_template('login.html', msg=msg)

@app.route('/logout')
def logout():
   session.pop('loggedin', None)
   session.pop('id', None)
   session.pop('username', None)
   session.pop('role',None)
   return redirect(url_for('login'))


@app.route('/signup', methods=['GET', 'POST'])
def signup():
    msg=''
    if request.method== 'GET':
        return render_template('signup.html')
    if request.method == 'POST':
        email = request.form['email']
        if isValid(email)==False:
            msg="Email id does not belong to CMRIT"
            return render_template('signup.html', msg=msg)
        password = request.form['password']
        USN = request.form['USN']
        phone = request.form['phone']
        cursor = mysql.connection.cursor(MySQLdb.cursors.DictCursor)
        cursor.execute('INSERT INTO user VALUES (NULL, %s, %s, %s,%s)', (email, password, USN, phone,))
        mysql.connection.commit()
        msg="Signed in successfully"
        return render_template('login.html',msg=msg)
    return "gadbad"

        
def timekeeper(string):
    for i in range(len(string)):
        if string[i]=='T':
            string[i]==' '
    return string

def maps(a,b):
    import googlemaps
    gmaps = googlemaps.Client(key='AIzaSyB6VfeBAvNWBxNAXc5Wzgxmq90OcPghkOk')

    my_dist = gmaps.distance_matrix(a,b)['rows'][0]['elements'][0]
  
    distance = (my_dist['distance']['text'])
    time = (my_dist['duration']['text'])
    return distance,time

@app.route('/home',methods=['GET', 'POST'])
def home():
    if 'loggedin' not in session:
        return redirect('/login')
    list = loc()
    if request.method == 'GET':
        return render_template('home.html',data=list)
    if request.method == 'POST':
        pickup= request.form['pickup']
        drop= request.form['drop']
        time= request.form['date']
        a=maps(pickup,drop)
        distance = a[0]
        duration = a[1]
        date = time[0:10]+' '+time[11:]+":00.00"
        date_format_str = '%Y-%m-%d %H:%M:%S.%f'
        time= datetime.strptime(date, date_format_str)
        n=15
        timetop = time + timedelta(minutes=n)
        timefloor= time - timedelta(minutes=n)
        queue = []
        cursor = mysql.connection.cursor(MySQLdb.cursors.DictCursor)
        cursor.execute('SELECT * FROM path WHERE date between %s and %s', (timefloor, timetop,))
        content = cursor.fetchall()
        for i in content:
            if pickup in i['path_points'] and drop in i['path_points']:
                queue.append(i)
        return render_template('options.html',queue=queue,distance=distance,duration=duration)
    return render_template('home.html',data=list)

@app.route('/sendreq',methods=['GET', 'POST'])
def sendreq():
    user_id=session['id']
    owner_id=request.form['owner_id']
    status='pending'
    path_id=request.form['path_id']
    distance = request.form['distance']
    dist=distance[0:len(distance)-3]
    charge = request.form['charge']
    distance=float(dist)
    charge=float(charge)
    cost=distance*charge
    cursor = mysql.connection.cursor(MySQLdb.cursors.DictCursor)
    cursor.execute('INSERT INTO request VALUES (NULL, %s, %s, %s,%s,%s)', (user_id, owner_id, status, path_id, cost,))
    mysql.connection.commit()
    return redirect('/home')

@app.route('/ownerhome',methods=['GET', 'POST'])
def ownerhome():
    list = loc()
    if request.method == 'POST':
        point=request.form['location']
        selected_list.append(point)
        return render_template('ownerhome.html',data=list,selected_list=selected_list)
    if request.method == 'GET':
        return render_template('ownerhome.html',data=list,selected_list=selected_list)
    return render_template('ownerhome.html',selected_list=selected_list,data=list)


@app.route('/create', methods=['GET','POST'])
def create():
    if request.method=='GET':
        return render_template('create.html')
    if session['role']=='owner' and request.method=='POST':
        owner_id= session['id']
        path = json.dumps(selected_list)
        date = request.form['date']
        charge = request.form['charge']
        cursor = mysql.connection.cursor(MySQLdb.cursors.DictCursor)
        cursor.execute('INSERT INTO path VALUES (NULL, %s, %s, %s,%s)', (path, owner_id, date, charge,))
        mysql.connection.commit()
        return "Done"
    else:
        return "User not authorized as owner"



@app.route('/viewrequest')
def viewrequest():
    if session['role']=='owner':
        id=session['id']
        cursor = mysql.connection.cursor(MySQLdb.cursors.DictCursor)
        cursor.execute('SELECT * FROM request WHERE owner_id = %s',(id,))
        account = cursor.fetchall()
        return render_template('x.html',data=account)
    return redirect('/ownerlogin')



if __name__ == '__main__':
    app.run(debug=True)

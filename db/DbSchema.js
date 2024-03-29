/**
 * Created by pariskshitdutt on 09/06/15.
 */
var mongoose = require('mongoose');
//var mockgoose=require('mockgoose');
var config = require('config');
var events = require('../events');
var log = require('tracer').colorConsole(config.get('log'));
var ObjectId = require('mongoose').Types.ObjectId;
var validate = require('mongoose-validator');
var nameValidator = [
    validate({
        validator: 'isLength',
        arguments: [3, 50],
        message: 'Name should be between 3 and 50 characters'
    })
];
var emailValidator=[
    validate({
        validator: 'isEmail',
        message: "not a valid email"
    })
];
var phoneValidator = [
    validate({
        validator: 'isLength',
        arguments: [10, 10],
        message: 'phonenumber should be 10 digits'
    })
];
var db=mongoose.createConnection(config.get('mongo.location'),config.get('mongo.database'));
var userdef;
var pindef;
var busdef;
var routesdef;
var cachefidef;
var citiesdef;
var bookingsdef;
var catalogdef;
var buslocationdef;
var auditsdef;
var questionsdef;
var feedbackdef;
var Schema = mongoose.Schema;
mongoose.set('debug', config.get('mongo.debug'));
/**
 * user schema stores the user data the password is hashed
 * @type {Schema}
 */
var userSchema=new Schema({
    _id:String,
    email:String,
    bus_id:String,
    phonenumber:{type:String,validate:phoneValidator,unique:true,dropDups:true},
    password:{type:String,required:true},
    name:{type:String},
    device:{service:String,reg_id:String,active:{type:Boolean,default:true}},
    contacts:[{phonenumber:{type:String},name:String,_id:false}],
    profession:{type:String},
    url:{type:String},
    is_operator:{type:Boolean,default:false},
    is_admin:{type:Boolean,default:false},
    address:{type:String},
    is_verified:{type:Boolean,default:false},
    is_service:{type:Boolean,default:false},
    is_random_password:{type:Boolean,default:true},
    created_time:{type:Date,default:Date.now},
    modified_time:{type:Date,default:Date.now}
});
var pinschema=new Schema({
    phonenumber:{type:String},
    pin:Number,
    used:{type:Boolean,default:false}
})
var busschema=new Schema({
    user_id:{type:Schema.ObjectId,ref:'user'},
    bus_identifier:String,
    bus_type:String,
    row_seats:Number,
    fare:Number,
    route:{type:Schema.ObjectId,ref:'routes',index:true},
    discounts:String,
    discounted_price:Number,
    images:[String],
    total_seats:Number,
    departure_time:Date,
    is_deleted:{type:Boolean,default:false},
    in_transit:{type:Boolean,default:false},
    seats:[{seat_no:Number,is_window:Boolean,is_booked:{type:Boolean,default:false},booking_id:{type:Schema.ObjectId,ref:'bookings'},_id:false}],
    in_booking:{type:Boolean,default:true},
    loo_requests:{type:Number,default:0},
    is_completed:{type:Boolean,default:false},
    created_time:{type:Date,default:Date.now},
    modified_time:{type:Date,default:Date.now}
});
var routesSchema=new Schema({
    start:{type:String,index:true},
    end:{type:String,index:true},
    start_loc:{type:[Number],index:"2dsphere"},
    end_loc:{type:[Number],index:"2dsphere"},
    boarding_points:[{
        point:String,
        location:{type:[Number],index:"2dsphere"},
        time_taken:Number,
        _id:false}],
    scheduled_stops:[{
        name:String,
        location:{type:[Number], index:"2dsphere"},
        restaurants_available:[String],
        is_loo:Boolean,
        is_snacks:Boolean,
        is_food:Boolean,
        time_taken:Number,
        _id:false
    }],
    fare:Number,
    distance:Number,
    time_taken:Number,
    active:{type:Boolean,default:false},
    created_time:{type:Date,default:Date.now},
    modified_time:{type:Date,default:Date.now}
});
var buslocationschema=new Schema({
    bus_identifier:{type:String},
    temperature:Number,
    humidity:String,
    speed:Number,
    load_average:Number,
    ram_used:Number,
    total_ram:Number,
    ram_used_process:Number,
    upload_speed:Number,
    download_speed:Number,
    ip:String,
    uptime:Number,
    cpus:{model:String,speed:Number,count:Number},
    bearing:String,
    users_connected:Number,
    pi_time:Date,
    location:{type:[Number], index:"2dsphere"},
    created_time:{type:Date,default:Date.now},
    modified_time:{type:Date,default:Date.now}
})
/**
 *  audit schema stores all the things checked during an audit in the bus and the bus id
 */
var auditschema=new Schema({
    bus_id:{type:Schema.ObjectId, ref:'buses'},
    bus_identifier:String,
    location:{type:[Number], index:"2dsphere"},
    cleanliness:Number,
    volvo_driver:Boolean,
    phone_holder:{all:Boolean, info:String},
    phone:Boolean,
    uniform:Boolean,
    first_aid:Boolean,
    pushback_lever:{all:Boolean, info:String},
    legrest_lever:{all:Boolean, info:String},
    ac_vent:{all:Boolean, info:String},
    powersocket:{all:Boolean, info:String},
    accessory_bag:{all:Boolean, info:String},
    blankets:{all:Boolean, info:String},
    headrest_cover:{all:Boolean, info:String},
    reading_lamp:{all:Boolean, info:String},
    audit_time:{type:Date,default:Date.now()},
    created_time:{type:Date,default:Date.now},
    modified_time:{type:Date,default:Date.now}
});
/**
 *  questions schema stores the questions corresponding to the things checked during an audit
 *  for the auditor application
 */
var questionschema=new Schema({
    question:String,
    q_type:String,
    name:String
});
var bookingschema=new Schema({
    user_id:{type:Schema.ObjectId,ref:'user'},
    bus_id:{type:Schema.ObjectId,ref:'buses'},
    amount:Number,
    is_confirmed:{type:Boolean,default:false},
    seat_no:[Number],
    feedback:String,
    is_deleted:{type:Boolean,default:false},
    created_time:{type:Date,default:Date.now},
    modified_time:{type:Date,default:Date.now}
});
var citiesSchema=new Schema({
    name:{type:String,index:true},
    location:{type:[Number], index:"2dsphere"}
});
var cachefiSchema=new Schema({
    bus_identifier:{type:String,unique:true,index:true,dropDups:true},
    media_load:[{type:Schema.ObjectId,ref:'catalog'}],
    in_standby:Boolean,
    local_language:String,
    last_refresh:Date
});
var catalogSchema=new Schema({
    name:String,
    description:String,
    pic:String,
    path:String,
    skips:Number,
    views:Number,
    language:String,
    content_type:String
})
var feedbackSchema=new Schema({
    _id:String,
    user_id:String,
    phonenumber:String,
    bus_id:{type:String},
    staff_rating:Number,
    snacks_rating:Number,
    cleanliness_rating:Number,
    app_rating:Number,
    tracking_rating:Number,
    punctuality_rating:Number,
    rating:Number,
    feedback:String,
    created_time:{type:Date,default:Date.now},
    modified_time:{type:Date,default:Date.now}
})
routesSchema.index({start:1,end:1},{unique:true});
db.on('error', function(err){
    log.info(err);
});
/**
 * once the connection is opened then the definitions of tables are exported and an event is raised
 * which is recieved in other files which read the definitions only when the event is received
 */
    userdef=db.model('user',userSchema);
    pindef=db.model('pins',pinschema);
    busdef=db.model('buses',busschema);
    buslocationdef=db.model('buslocation',buslocationschema);
    bookingsdef=db.model('bookings',bookingschema);
    cachefidef=db.model('cachefi',cachefiSchema);
    citiesdef=db.model('cities',citiesSchema);
    routesdef=db.model('routes',routesSchema);
    catalogdef=db.model('catalog',catalogSchema);
    auditsdef=db.model('audits',auditschema);
    questionsdef=db.model('questions',questionschema);
    feedbackdef=db.model('feedback',feedbackSchema);

    exports.getpindef=pindef;
    exports.getbusdef=busdef;
    exports.getbookingsdef=bookingsdef;
    exports.getcitiesdef=citiesdef;
    exports.getuserdef= userdef;
    exports.getcachefidef= cachefidef;
    exports.getcatalogdef= catalogdef;
    exports.getbuslocationdef= buslocationdef;
    exports.getroutesdef= routesdef;
    exports.getauditsdef=auditsdef;
    exports.getquestionsdef=questionsdef;
    exports.getfeedbackdef=feedbackdef;
    events.emitter.emit("db_data");


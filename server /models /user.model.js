import { Schema,model } from "mongoose";
import bcrypt from 'bcrypt';
import JWT from 'jsonwebtoken';
import crypto from 'crypto';
const userSchema = new Schema({
    fullName: {
        type : 'String',
        require : [true, 'Name is required'],
        minLength: [5,'Name must be 5 chars'],
        maxLength: [50,'Name must be less than 50 chars'],
        lowercase: true,  // saves all data in lowercase in db
        trim: true
    },
    email: {
        type : 'String',
        require : [true, 'Email is required'],
        minLength: [5,'Email must be 5 chars'],
        maxLength: [50,'Email must be less than 50 chars'],
        lowercase: true,  // saves all data in lowercase in db
        trim: true,
        unique: true,
        match: [
            /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/, 
            'Please fill in a valid email address', 
        ],
    },
    password: {
        type : 'String',
        require: [true, 'Password is required'],
        minLength: [8,'Password must be atleast 8 chars'],
        select: false,
    },
    // cloudinary for avatars/userProfImages
    avatar: {
        public_id: {
            type: 'String', // give ur public id
        },
        secure_url: {
            type: 'String', // secure url to access only certain credentials
        },
    },
    role: {
        type: 'String',
        enum: ['USER','ADMIN'],
        default: 'USER'
    },
    forgotPasswordToken : String,
    forgotPasswordExpiry : Date,
}, {
    timestamps: true
});

// to write generic methods in models
// userSchema.methods = { }

// .pre('save', function(next) { } ) -- db mein save krne se pehle ye func run krdo aur pass encrypt krke db mein save kro

userSchema.pre('save', async function (next) {
    if(!this.isModified('password')) {
        return next();
    }   
    this.password = await bcrypt.hash(this.password, 10)
})
userSchema.methods = {
    // jwt token stores all this info in encrypted format 
// k
    // token mdhe itki user related info taknar mi ji mala needed vatte
    generateJWTToken : async function() {
        
        return await JWT.sign( // all user info gets stored in an object
            {id: this._id, email: this.email, subsciption: this.subsciption, role: this.role},
            process.env.JWT_SECRET,
             {
                expiresIn: process.env.JWT_EXPIRY
            }
        )
    },
    comparePassword: async function(plainTextPassword) {
        return await bcrypt.compare(plainTextPassword,this.password)
    },

    generatePasswordResetToken: async function () {
        const resetToken = crypto.randomBytes(20).toString('hex');

        this.forgotPasswordToken = crypto
            .createHash('sha256')
            .update(resetToken)
            .digest('hex')
        ;
        this.forgotPasswordExpiry = Date.now() + 15 * 60 * 1000; // 15min from now

        return resetToken;
    }
}
const User = model('User',userSchema);

export default User;

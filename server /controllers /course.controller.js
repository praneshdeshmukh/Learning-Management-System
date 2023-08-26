import Course from "../models/course.model.js";
import AppError from "../utils/error.util.js";
import cloudinary from 'cloudinary'
import fs from 'fs/promises'

const getAllCourses = async (req,res,next) => {

    try {
        //bcz, we want courses only high level detail
        //& not the lecture info
        //eg-Student who havent buyed course cannnot 
        //be able to see lectures related info 
        const allCourses = await Course.find({}).select('-lectures');
        
        res.status(200).json({
            success: true,
            message: 'Courses Available',
            allCourses
        })


    } catch (e) {
        return next(new AppError('Something happened, try again later',500))
    }

};


const getLecturesByCourseId = async (req,res,next) => {

    try {

        const { id } = req.params;
        console.log('course id :',id);
        const course = await Course.findById(id);
        console.log('course details:', course);
        if(!course) {
            return next(
                new AppError('Invalid course Id',400)
            )
        }
        res.status(200).json({
            success: true,
            message: 'Course details',
            lecture: course.lectures
        })


        
    } catch (e) {
        return next(new AppError('Something happened, try again later',500))
    }



};


const createCourse = async (req,res,next) => {
    const { title, description, category, createdBy } = req.body;

    if(!title ||  !description || !category || !createdBy){
        return next(
            new AppError('All fields are required',400)
        )
    }

    const course = await Course.create({
        title,
        description,
        category,
        createdBy,
        thumbnail: {
            public_id: 'dummy',
            secure_url: 'dummy'
        } 
    })

    if(!course) {
        return next(
            new AppError('Course could not be created,try again', 500)
        )
    }

    if(req.file) {
        try {
            
            const result = await cloudinary.v2.uploader.upload(req.file.path, {
                folder: 'lms',
            });
    
            if(result) {
                course.thumbnail.public_id = result.public_id;
                course.thumbnail.secure_url = result.secure_url;
            }
    
            // to remove the file(img)
            // fs.rm(`uploads/${req.file.filename}`);

        } catch (e) {
            return next(
                new AppError(e.message,500)
            )
        }

        await course.save();
    
        res.status(200).json({
            success: true,
            message: "course has been created successfully!",
            course
        })
    }
};


const updateCourse = async (req,res,next) => {

    try {
        const { id } = req.params;
    
        const courseById = await Course.findByIdAndUpdate(
            id,
            { // whatever is comming in body update that
                // field in the cours suppose. "description"
                $set: req.body
            },
            { //checks whatever new data comming in body
                // is an existing field in the model 
                // or not. suppose "couurseTeam" (no such field)
                runValidators: true
            }
        )
        if(!courseById) {
            return next(
                new AppError('Course with given ID does not exist',500)
            ) 
        }
        res.status(200).json({
            success:true,
            message: 'Course updated successfully',
            courseById
        });
        
    } catch (error) {
        return next(
            new AppError(e.message,500)
        )
    }
};


const deleteCourse = async (req,res,next) => {

    try {
        
        const { id } = req.params;
    
        const courseToRemove = await Course.findById(id);
        
        if(!courseToRemove) {
            return next(
                new AppError('Course with given ID does not exist',500)
                ) 
            }
        await Course.findByIdAndDelete(id);
        
        res.status(200).json({
            success: true,
            message: "Course deleted successfully!",
        })
        
    } catch (e) {

        return next(
            new AppError(e.message , 500)
        ) 
    }
};

const addLectureToCourse = async (req,res,next) => {
    try {
  
        const {title, description } = req.body;
        const { id } = req.params;
    
        if(!title || !description) {
            return next(
                new AppError('All fields are required',400)
            )
        }
        const courseToAddLectures = await Course.findById(id);
    
        if(!courseToAddLectures) {
            return next(
                new AppError('Course does not exist',400)
            )
        };
    
        // save all info of lecuture in lectureData
        const lectureData = {
            title,
            description,
            lecture: {},
        } 
        // all info is done but thumbnail remains
        if(req.file) {
            try {
                
                const result = await cloudinary.v2.uploader.upload(req.file.path, 
                    {
                        folder: 'lms',
                    },
                );
                if(result) {
                    lectureData.lecture.public_id = result.public_id;
                    lectureData.lecture.secure_url = result.secure_url;
                };
    
            } catch (e) {
                return next(
                    new AppError(e.message,400)
                )
            }
            console.log('lecture ->', JSON.stringify(lectureData));
            courseToAddLectures.lectures.push(lectureData);
    
    
            courseToAddLectures.numberOfLectures = courseToAddLectures.lectures.length;
            
            await courseToAddLectures.save();
    
    
            res.status(200).json({
                success: true,
                message: 'Lecture added successfully!',
                courseToAddLectures
            })
        }

        
    } catch (e) {
        return next(
            new AppError(e.message,500)
        )
    }

}
export {
    getAllCourses,
    getLecturesByCourseId,
    createCourse,
    updateCourse,
    deleteCourse,
    addLectureToCourse
}

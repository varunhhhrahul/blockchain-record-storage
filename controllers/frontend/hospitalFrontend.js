const asyncHandler = require('../../middleware/async');
const {
  getPatientDataRequests,
  getPatientDataRequestById,
  approvePatientDataRequest,
  addDataToSheet
} = require('../../API/patientDataRequests');
const { getHospitalForUser, addHospital } = require('../../API/hospitalRequests');

exports.dashboard = asyncHandler(async (req, res, next) => {
  let pdRequests = [];
  try {
    let data = await getHospitalForUser();
    // if already has made a request

    if (data.length === 1) {
      const hospital = data[0];
      data = await getPatientDataRequests(hospital.id);
      pdRequests = [...data];
      res.render('hospital-dashboardNext.ejs', {
        user: req.user,
        pdRequests,
        hospital
      });
    } else {
      res.render('hospital-dashboard.ejs', { user: req.user });
    }
  } catch (error) {
    console.log(error);
    if (error.response) {
      req.flash('error_msg', error.response.data.error);
    }
      res.redirect('/auth/login');
  }
});

exports.getAddHospital = asyncHandler(async (req, res, next) => {
  res.render('add-hospital',{user: req.user});
});

exports.postAddHospital = asyncHandler(async (req, res, next) => {
 const {name, description, registrationNumber, website, phone, email, address, publicKey} = req.body
  let errors = [];
  try {
    if(!name || !description || !registrationNumber || !website || !phone || !email || !address){
       errors.push({ msg: 'Please enter all fields' });
    }

    if(errors.length > 0){
      req.flash('error_msg',errors[0])
      res.redirect('/hospitals/add-hospital')
     } else {
      let data = await addHospital(req.body);
      req.flash('success_msg', 'Hospital Added Successfully');
      res.redirect('/hospitals/dashboard');
     }
  } catch (error) {
    if (error.response) {
      if(error.response.data.error === "Duplicate field value entered"){
        errors.push({msg: "Hospital Name already registered"})
      } else {
        errors.push({msg: error.response.data.error })
      }
    }
      req.flash('error_msg',errors[0])
      res.redirect('/hospitals/add-hospital')
  }
});

exports.getAddPatientData = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  try {
    const data = await getPatientDataRequestById(id);
    const { user, comment, hospital } = data;
    console.log('')
    res.render('add-patient-data.ejs', {id, user, comment, hospital, owner: req.user });
  } catch (error) {
    if (error.response) {
      req.flash('error_msg', error.response.data.error);
    }
    res.redirect('/hospitals/dashboard');
  }
});

exports.postAddPatientData = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  console.log(id)
  try {
    const data = await approvePatientDataRequest(id);
    await addDataToSheet(id)
    req.flash('success_msg', 'Request approved for patient');
    res.redirect('/hospitals/dashboard');
  } catch (error) {
    if (error.response) {
      req.flash('error_msg', error.response.data.error);
    }
    res.redirect('/hospitals/dashboard');
  }
});

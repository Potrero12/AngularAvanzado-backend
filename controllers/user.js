'use strict'

//modulos
var bcrypt = require('bcrypt-nodejs');
var fs = require('fs');
var path = require('path');

//modelos
var User = require('../models/user');

//servicio jwt
var jwt = require('../services/jwt');

//acciones
function pruebas(req, res){
	res.status(200).send({
		message: 'Probando el controlador de usuarios y la accion pruebas',
		user: req.user
	});
}

function saveUser(req, res){
	//crear objeto usuario
	var user = new User();
	//recoger los parametros peticion
	var params = req.body;
	if(params.name && params.surname && params.email && params.password){
		//asignar valores al objeto usuario
		user.name = params.name;
		user.surname = params.surname;
		user.email = params.email;
		user.role = 'ROLE_USER';
		user.image = null;

		User.findOne({email: user.email.toLowerCase()}, (err, issetUser) => {
			if(err){
				return res.status(500).send({message: 'Error al comprobar que el usuario existe'});
			}else{
				if(!issetUser){
					//cifrar contraseña
					bcrypt.hash(params.password, null, null, function(err, hash){
						user.password = hash;

						//guardar el usuario en la base de datos
						user.save((err, userStored) => {
							if(err){
								return res.status(500).send({message: 'Error al guardar usuario'});
							}else{
								if(!userStored){
									return res.status(404).send({message: 'No se ha registrado el usuario'});
								}else{
									return res.status(200).send({user: userStored});
								}
							}
						});
					});
				}else{
					return res.status(404).send({message: 'No se puede registrar el usuario porque ya existe'});
				}
			}
		});
	}else{
		return res.status(200).send({message: 'Introduce los datos correctamente para poder registrar al usuario'})	
	}
}

function login(req, res){
	var params = req.body;

	var email = params.email;
	var password = params.password;

	User.findOne({email: email.toLowerCase()}, (err, user) => {
		if(err){
			 return res.status(500).send({message: 'Error al comprobar que el usuario existe'});
		}else{
			if(!user){	
				return res.status(404).send({message: 'El usuario no existe'});
			}else{
				bcrypt.compare(password, user.password, (err, check) => {
					if(check){
						//comprobar y generar token
						if(params.gettoken){
							//devolver token jwt
							res.status(200).send({token: jwt.createToken(user)});
						}else{
							return res.status(200).send({user});
						}
					}else{
						return res.status(404).send({message: 'El usuario no ha podido logearse correctamente, revisa los datos ingresados.'});
					}
				});
			}
		}
	});
}

function updateUser(req, res){
	var userId = req.params.id;
	var update = req.body;
	delete update.password;
	
	if(userId != req.user.sub){
		return res.status(500).send({message: 'no tienes permiso para actualizar el usuario'});
	}

	User.findByIdAndUpdate(userId, update, {new:true} ,(err, userUpdated) => {
		if(err){
			return res.status(500).send({message: 'Error al actualizar usuario'});
		}else{
			if(!userUpdated){
				return res.status(404).send({message: 'no se ha actualizado el usuario'});
			}else{
				return res.status(200).send({user: userUpdated});
			}
		}
	});
}

function uploadImage(req, res){
	var userId = req.params.id;
	var file_name = 'No subido...';

	if(req.files){
		var file_path = req.files.image.path;
		var file_split = file_path.split('\\');
		var file_name = file_split[2];

		var ext_split = file_name.split('\.');
		var file_ext = ext_split[1];

		if(file_ext == 'png' || file_ext == 'jpg' || file_ext == 'jpeg' || file_ext == 'gif'){

			if(userId != req.user.sub){
				return res.status(500).send({message: 'no tienes persmiso para actualizar el usuario'});
			}
			User.findByIdAndUpdate(userId, {image: file_name}, {new:true} ,(err, userUpdated) => {
				if(err){
					return res.status(500).send({message: 'Error al actualizar usuario'});
				}else{
					if(!userUpdated){
						return res.status(404).send({message: 'no se ha actualizado el usuario'});
					}else{
						return res.status(200).send({user: userUpdated, image: file_name});
					}
				}
			});
		}else{
			fs.unlink(file_path, (err) => {
				if(err){
					return res.status(200).send({message: 'extensión no valida y fichero no borrado'});
				}
				else{
					return res.status(200).send({message: 'extensión no valida'});
				}
			})
			
		}
	}else{
		return res.status(200).send({message: 'no se han subido archivos'});
	}
}

function getImageFile(req, res){
	var imageFile = req.params.imageFile;
	var path_File = './uploads/users/'+imageFile;

	fs.exists(path_File, function(exists){
		if(exists){
			return res.sendFile(path.resolve(path_File));
		}else{
			return res.status(404).send({message: 'La imagen no existe'});
		}
	});
}

function getKeepers(req, res){
	User.find({role: 'ROLE_ADMIN'}).exec((err, users) =>{
		if(err){
			return res.status(500).send({message: 'Error en la petición'});
		}else{
			if(!users){
				return res.status(404).send({message: 'No hya cuidadores'});
			}else{
				return res.status(200).send({users});
			}
		}
	});
}

module.exports = {
	pruebas,
	saveUser,
	login,
	updateUser,
	uploadImage,
	getImageFile,
	getKeepers
};
var fs = require('fs');
module.exports = function(app) {
	
	app.post('/upload/imagem', function(req, res){
		console.log('recebendo arquivo');

		var fileName = req.headers.filename;
		req.pipe(fs.createWriteStream('files/' + fileName))
			.on('finish', function(){
				console.log('arquivo escrito');
				req.status(201).send('ok');
			})
			
	})

}
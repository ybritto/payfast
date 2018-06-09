module.exports = function(app){

	app.get("/pagamentos", function(req, res){
		res.send("ok");
	});

	app.post("/pagamentos/pagamento", function(req, res){

		var pagamento = req.body;
		var connection = app.persistencia.connectionFactory();
		var pagamentoDao = new app.persistencia.PagamentoDao(connection);

		req.assert("forma_de_pagamento", "Forma de pagamento é obrigatorio").notEmpty();
		req.assert("valor", "Valor é obrigatorio").notEmpty().isFloat();
		req.assert("moeda", "Moeda é obrigatorio").notEmpty().len(3,3);

		var errors = req.validationErrors();

		if (errors) {
			console.log("Erros de validação encontrados");
			res.status(400).send(errors);
			return;
		}

		pagamento.status = "CRIADO";
    pagamento.data = new Date;

		console.log("Processando pagamento...");
		pagamentoDao.salva(pagamento, function(exception, result){
			console.log("Pagamento criado " + result);
			res.location('/pagamentos/pagamento/' + result.insertId);
      pagamento.id = result.insertId;
      res.status(201).json(pagamento);
		})

	});

}

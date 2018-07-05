module.exports = function(app){

	app.get("/pagamentos", function(req, res){
		res.send("ok");
	});

	app.post("/pagamentos/pagamento", function(req, res){

		var body = req.body;
		var pagamento = body['pagamento'];
		var connection = app.persistencia.connectionFactory();

		var pagamentoDao = new app.persistencia.PagamentoDao(connection);

		req.assert("pagamento.forma_de_pagamento", "Forma de pagamento é obrigatorio").notEmpty();
		req.assert("pagamento.valor", "Valor é obrigatorio").notEmpty().isFloat();
		req.assert("pagamento.moeda", "Moeda é obrigatorio").notEmpty().len(3,3);

		var errors = req.validationErrors();

		if (errors) {
			console.log("Erros de validação encontrados");
			res.status(400).send(errors);
			return;
		}

		if (pagamento.forma_de_pagamento == 'cartao') {
			var cartao = req.body['cartao'];
			console.log(cartao);

			var clienteCartoes = new app.servicos.clienteCartoes();
			clienteCartoes.autoriza(cartao,function(exception, request, response,retorno){
				if(exception){
					console.log(exception);
					res.status(400).send(exception);
					return;
				}
				console.log(retorno);

				res.location('/pagamentos/pagamento' + pagamento.id);
				var response = {
					dados_do_pagamento: pagamento,
					cartao: retorno,
					links: [
						{
							href: "http://localhost:3000/pagamentos/pagamento/" + pagamento.id,
							rel: "cancelar",
							method: "DELETE"
						}
					]
				}

				res.status(201).json(response);
				return;

			});

		} else {

			pagamento.status = "CRIADO";
	    pagamento.data = new Date;

			console.log("Processando pagamento...");
			pagamentoDao.salva(pagamento, function(exception, result){
				console.log("Pagamento criado " + result);
				res.location('/pagamentos/pagamento/' + result.insertId);
	      pagamento.id = result.insertId;
	      res.status(201).json(pagamento);
			})

		}

	});

}
